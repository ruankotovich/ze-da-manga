
(function () {
  
  
  const MAIN_THEME = new Audio('./sfx/theme.mp3');
  const BOSS_THEME = new Audio('./sfx/bosstheme.mp3');
  const END = new Audio('./sfx/end.mp3');
  const HURT = new Audio('./sfx/hurt.mp3');
  const SCREAM = new Audio('./sfx/scream.mp3');
  const ONEUP = new Audio('./sfx/oneup.wav');
  const DYING = new Audio('./sfx/dying.wav');
  const ROAR = new Audio('./sfx/roar.wav');
  const FLARE = new Audio('./sfx/flare.wav');
  let OBSTACLE_CLASSES = []
  
  OBSTACLE_CLASSES = OBSTACLE_CLASSES.concat(Array(100).fill("tree"));
  OBSTACLE_CLASSES = OBSTACLE_CLASSES.concat(Array(20).fill("big_tree"));
  OBSTACLE_CLASSES = OBSTACLE_CLASSES.concat(Array(10).fill("flame_brush"));
  OBSTACLE_CLASSES = OBSTACLE_CLASSES.concat(Array(10).fill("tree_trunk"));
  OBSTACLE_CLASSES = OBSTACLE_CLASSES.concat(Array(10).fill("rock"));
  OBSTACLE_CLASSES = OBSTACLE_CLASSES.concat(Array(20).fill("dog"));
  OBSTACLE_CLASSES = OBSTACLE_CLASSES.concat(Array(4).fill("mushroom"));
  OBSTACLE_CLASSES = OBSTACLE_CLASSES.concat(Array(40).fill("flare"));
  OBSTACLE_CLASSES = OBSTACLE_CLASSES.concat(Array(1).fill("nath"));
  OBSTACLE_CLASSES = OBSTACLE_CLASSES.concat(Array(1).fill("coelinho"));
  
  const FPS = 60;
  const TAMX = 800;
  const TAMY = 600;
  const PROB_OBSTACLE = .5;
  const OVERFLOW_LIMIT_LEFT = 80;
  const OVERFLOW_LIMIT_RIGHT = TAMX - OVERFLOW_LIMIT_LEFT;
  let speed = 2;
  let overflow = false;
  let gameLoop;
  let hill;
  let skier;
  let panel;
  let iceman;
  let directions = ['para-esquerda', 'para-frente', 'para-direita']
  let iceman_directions = ['iceman_lstep1', 'iceman_lstep2', 'iceman_rstep1', 'iceman_rstep2'];
  let horizontal_speed = [-2, 0, 2];
  let obstacles = [];
  
  function lateralIntersects(a, b) {
    return !(a.x + a.width < b.x || b.x + b.width < a.x);
  }
  
  function intersects(a, b) {
    return !(a.x + a.width < b.x || b.x + b.width < a.x || a.y + a.height < b.y || b.y + b.height < a.y)
  }
  
  function init() {
    hill = new Hill();
    skier = new Skier();
    panel = new LateralPanel();
    panel.refresh(skier);
    iceman = new Iceman();
    
    let info = new Obstacle();
    info.element.className = 'info';
    info.element.style.top = `120px`;
    info.element.style.left = `${(TAMX >> 1) - (info.getPosition().width >> 1)}px`;
    info.notEroded = false;
    obstacles.push(info);
    
    set = false;
    window.addEventListener('keypress', (event)=>{
      if(!set && (event.key === 'p' || event.key === 'P')){
        MAIN_THEME.play();
        gameLoop = setInterval(run, 1000 / FPS);
        set = true;
      }
    })
  }
  
  window.addEventListener('keydown', function (e) {
    if (skier.notInLockdown && skier.alive) {
      if (e.key == 'a') skier.changeDirection(-1);
      else if (e.key == 'd') skier.changeDirection(1);
      else if (e.key == 'f') speed = speed == 2 ? 3 : 2;
      else if (e.keyCode == 37) skier.changeDirection(-1);
      else if (e.keyCode == 39) skier.changeDirection(1);
      else if (e.keyCode == 40) speed = speed == 2 ? 3 : 2;
    }
  });
  
  function LateralPanel() {
    this.element = document.getElementById('panel');
    
    this.refresh = (skier) => {
      this.element.innerHTML = `<b>Distância</b></br>${skier.distance}<br><b>Velocidade</b></br>${speed * 10}km/h</br><b>Estabilidade</b></br><div class='stability' style='width:${skier.stability}%;background-color:${skier.stability > 20 ? 'aqua' : 'red'}'></div></br><br><img src='./css/heart.png' width='25px' height='25px'/>${skier.lifes}`;
    }
    
    this.finalPuntuaction = (pt) => {
      this.element.innerHTML = `<center><b><font color='red'>Você morreu!</font></b><br>Sua pontuação é <b>${pt}.</b><br><a href='javascript:window.location.href=window.location.href'>Tentar Novamente</a></center>`;
    }
  }
  
  function Hill() {
    this.element = document.getElementById("montanha");
    this.element.style.width = TAMX + "px";
    this.element.style.height = TAMY + "px";
    this.nextIceman = 2000;
  }
  
  function Iceman() {
    this.element = document.createElement('div');
    hill.element.appendChild(this.element);
    this.element.className = "iceman_lstep1";
    this.computedStyle = window.getComputedStyle(this.element, null);
    this.lastStep = 1;
    this.online = false;
    this.notStuned = true;
    
    this.start = () => {
      this.online = true;
      this.rebuild();
      BOSS_THEME.currentTime = MAIN_THEME.currentTime = 0;
      BOSS_THEME.pause();
      MAIN_THEME.pause();
      BOSS_THEME.play();
    }
    
    
    this.stop = () => {
      hill.nextIceman = skier.distance+ 2000;
      this.online = false;
      this.notStuned = true;
      this.rebuild();
      BOSS_THEME.currentTime = MAIN_THEME.currentTime = 0;
      BOSS_THEME.pause();
      MAIN_THEME.pause();
      MAIN_THEME.play();
    }
    
    this.rebuild = () => {
      this.element.style.top = '-50px';
      this.element.style.left = `${(parseInt(TAMX) >> 1) - (parseInt(this.computedStyle.height) >> 1)}px`;
    }
    
    this.walk = (skier) => {
      
      if (this.notStuned) {
        
        let pos = skier.getPosition();
        
        this.lastStep = (this.lastStep + 1) % 8;
        
        if (lateralIntersects(this.getPosition(), skier.getPosition())) {
          this.element.className = `iceman_${pos.x > parseInt(this.computedStyle.left)? 'r' : 'l'}step${this.lastStep > 4 ? 1 : 2}`;
        } else {
          if (pos.x > parseInt(this.computedStyle.left)) {
            this.element.style.left = `${parseInt(this.element.style.left) + 3}px`;
            this.element.className = `iceman_rstep${this.lastStep > 4 ? 1 : 2}`;
          } else if (pos.x < parseInt(this.computedStyle.left)) {
            this.element.className = `iceman_lstep${this.lastStep > 4 ? 1 : 2}`;
            this.element.style.left = `${parseInt(this.element.style.left) - 3}px`;
          } else {
            this.element.className = `iceman_rstep${this.lastStep > 4 ? 1 : 2}`;
          }
        }
        
        if (parseInt(this.element.style.top) + parseInt(this.computedStyle.height) < pos.y) {
          
          if (parseInt(this.element.style.top) < -80) {
            this.stop();
          }
          
          this.element.style.top = `${parseFloat(this.element.style.top) + (2.8 - speed)}px`
        } else {
          this.element.style.top = `${parseFloat(this.element.style.top) - 0.1}px`
        }
        
        if (intersects(this.getPosition(), skier.getPosition())) {
          skier.die();
          skier.element.style.display = 'none';
          
          setTimeout(() => {
            this.element.className = 'iceman_eating1';
            setTimeout(() => {
              this.element.className = 'iceman_eating2';
              setTimeout(() => {
                this.element.className = 'iceman_eating3';
                setTimeout(() => {
                  this.element.className = 'iceman_eating4';
                  setTimeout(() => {
                    this.element.className = 'iceman_eating5';
                    setTimeout(() => {
                      this.element.className = 'iceman_eating6';
                      setTimeout(() => {
                        this.element.className = 'iceman_eating5';
                        setTimeout(() => {
                          this.element.className = 'iceman_eating6';
                          setTimeout(() => {
                            this.element.className = 'iceman_eating7';
                            SCREAM.play();
                          }, 500);
                          
                        }, 600);
                        
                      }, 500);
                    }, 700);
                    
                  }, 400);
                  
                }, 400);
              }, 400);
              DYING.play();
            }, 400);
            
          }, 100);
          
        }
        
      } else {
        this.element.style.top = `${(parseInt(this.element.style.top) - speed)}px`;
      }
    }
    
    this.getPosition = () => {
      let x0 = parseInt(this.computedStyle.left);
      return { y: parseInt(this.computedStyle.top) + parseInt(this.computedStyle.height), height: 1, x: x0, width: parseInt(this.computedStyle.width) };
    }
    
    this.rebuild();
  }
  
  function Skier() {
    
    this.element = document.getElementById("skier");
    this.direcao = 1; //0-esquerda;1-frente;2-direita
    this.element.className = 'para-frente';
    this.element.style.top = '40%';
    this.element.style.left = parseInt(TAMX / 2) - 7 + 'px';
    this.computedStyle = window.getComputedStyle(this.element, null);
    this.notInLockdown = true;
    this.distance = 0;
    this.lifes = 3;
    this.stability = 100;
    this.alive = true;
    this.hitObstacle = () => {
      --this.lifes;
      
      this.notInLockdown = false;
      speed = 0;
      this.direcao = 1;
      
      if (this.lifes < 0) {
        this.element.className = 'raw-died';
        this.die();
      } else {
        HURT.play();
        this.element.className = 'queda';
        setTimeout(() => {
          if (this.alive) {
            speed = 2;
            this.element.className = 'para-frente'
            this.notInLockdown = true;
          }
        }, 1000);
        
      }
    }
    
    this.die = () => {
      BOSS_THEME.currentTime = MAIN_THEME.currentTime = 0;
      BOSS_THEME.pause();
      MAIN_THEME.pause();
      END.play();
      
      this.alive = false;
      this.lifes = 0;
      speed = 0;
      this.movement = 0;
      this.direcao = 0;
      overflow = false;
      panel.finalPuntuaction(this.distance);
    }
    
    this.getPosition = () => {
      let x0 = parseInt(this.computedStyle.left);
      return { y: parseInt(this.computedStyle.top) + parseInt(this.computedStyle.height), height: 1, x: x0, width: parseInt(this.computedStyle.width) };
    }
    
    this.changeDirection = function (giro) {
      if (this.direcao + giro >= 0 && this.direcao + giro <= 2) {
        this.direcao += giro;
        this.element.className = directions[this.direcao];
      }
    }
    
    this.andar = function () {
      if (this.direcao == 0) {
        
        if (parseInt(this.element.style.left) > OVERFLOW_LIMIT_LEFT) {
          this.element.style.left = (parseInt(this.element.style.left) + horizontal_speed[this.direcao]) + "px";
          overflow = false;
        } else if (this.alive) {
          overflow = true;
        }
      }
      if (this.direcao == 2) {
        if (parseInt(this.element.style.left) < OVERFLOW_LIMIT_RIGHT) {
          this.element.style.left = (parseInt(this.element.style.left) + horizontal_speed[this.direcao]) + "px";
          overflow = false;
        } else if (this.alive) {
          overflow = true;
        }
      }
    }
  }
  
  function Obstacle() {
    this.element = document.createElement('div');
    hill.element.appendChild(this.element);
    this.element.className = OBSTACLE_CLASSES[Math.floor(Math.random() * OBSTACLE_CLASSES.length)];
    this.element.style.top = TAMY + "px";
    this.element.style.left = (-500 + Math.floor(Math.random() * TAMX) + 500) + "px";
    this.computedStyle = window.getComputedStyle(this.element, null);
    this.notEroded = true;
    this.notSafe = true;
    
    if (this.element.className === 'mushroom' || this.element.className === 'flare' || this.element.className === 'info') {
      this.notSafe = false;
    }
    
    if (this.element.className === 'dog') {
      
      this.movement = ((obstacle) => {
        let random = Math.floor(Math.random() * 200);
        
        if (random > 70) {
          
          setTimeout(() => {
            obstacle.element.className = 'dog_move_1';
            obstacle.element.style.left = `${parseInt(obstacle.element.style.left) + 2}px`;
            setTimeout(() => {
              obstacle.element.className = 'dog_move_2';
              obstacle.element.style.left = `${parseInt(obstacle.element.style.left) + 2}px`;
              setTimeout(() => {
                obstacle.element.className = 'dog_move_1';
                obstacle.element.style.left = `${parseInt(obstacle.element.style.left) + 2}px`;
                setTimeout(() => {
                  obstacle.element.className = 'dog_move_2';
                  obstacle.element.style.left = `${parseInt(obstacle.element.style.left) + 2}px`;
                  setTimeout(() => {
                    obstacle.element.className = 'dog_move_1';
                    obstacle.element.style.left = `${parseInt(obstacle.element.style.left) + 2}px`;
                    setTimeout(() => {
                      obstacle.element.className = 'dog_move_2';
                      obstacle.element.style.left = `${parseInt(obstacle.element.style.left) + 2}px`;
                      setTimeout(() => {
                        obstacle.element.className = 'dog';
                        if (obstacle.notEroded) {
                          this.movement(obstacle);
                        }
                      }, 300);
                    }, 300);
                  }, 300);
                }, 300);
              }, 300);
            }, 300);
          }, 300);
          
        }
        
      });
      
      this.movement(this);
    } else if (this.element.className === 'flame_brush') {
      
      this.movement = ((obstacle) => {
        
        setTimeout(() => {
          obstacle.element.className = 'flame_brush_2';
          setTimeout(() => {
            obstacle.element.className = 'flame_brush_3';
            setTimeout(() => {
              if (obstacle.notEroded) {
                obstacle.element.className = 'flame_brush';
                obstacle.movement(obstacle);
              } else {
                obstacle.element.className = 'flame_brush_off';
              }
            }, 200);
          }, 200);
        }, 200);
        
        
      });
      
      this.movement(this);
    }
    
    this.getPosition = () => {
      
      let x0 = parseInt(this.computedStyle.left);
      let heightOverlay = parseInt(this.computedStyle.height) / 2;
      let y0 = parseInt(this.computedStyle.top);
      
      return { y: y0 + heightOverlay, height: heightOverlay, x: x0, width: parseInt(this.computedStyle.width) };
    }
  }
  
  function run() {
    var random = Math.floor(Math.random() * 1000);
    
    let nextItObstacles = [];
    let positionSkier = skier.getPosition();
    
    if (random <= PROB_OBSTACLE * 70 * speed) {
      var obstacle = new Obstacle();
      obstacles.push(obstacle);
    }
    
    if (skier.stability <= 1 && speed > 2) {
      speed = 2;
      stability = 100;
      skier.hitObstacle();
    }
    
    if (speed == 3) {
      skier.stability -= 0.1;
    } else if (skier.stability < 100) {
      skier.stability += 0.1;
    }
    
    obstacles.forEach(function (a) {
      a.element.style.top = (parseInt(a.element.style.top) - speed) + "px";
      if (overflow) {
        a.element.style.left = (parseInt(a.element.style.left) - horizontal_speed[skier.direcao]) + "px";
      }
      
      if (parseInt(a.element.style.top) > -100) {
        let positionObstacle = a.getPosition();
        
        if (a.notEroded && intersects(positionObstacle, positionSkier)) {
          console.log(positionObstacle, '<->', positionSkier);
          a.notEroded = false;
          console.log(a.element.className);
          if (a.notSafe) {
            skier.hitObstacle();
          } else {
            switch (a.element.className) {
              case 'mushroom': {
                ONEUP.pause();
                ONEUP.currentTime = 0;
                ONEUP.play();
                skier.lifes++;
                a.element.style.display = 'none';
              } break;
              case 'flare': {
                FLARE.pause();
                FLARE.currentTime = 0;
                FLARE.play();
                a.element.className = 'flare_on';
                if (iceman.online) {
                  iceman.notStuned = false;
                  iceman.element.className = 'iceman_stuned';
                  setTimeout(() => {
                    ROAR.play();
                    ROAR.currentTime = 0;
                    ROAR.play();
                    iceman.notStuned = true;
                  }, 500);
                }
              } break;
              default: {
                
              } break;
            }
            
          }
        }
        
        nextItObstacles.push(a);
      } else {
        a.notEroded = false;
      }
      
    });
    
    if (skier.alive) {
      skier.distance += speed;
      if (skier.distance >= hill.nextIceman) {
        if (!iceman.online) {
          iceman.start();
        }
      }
      
      panel.refresh(skier);
      obstacles = nextItObstacles;
      skier.andar();
      if (iceman.online) {
        iceman.walk(skier);
      }
    }
    
  }
  
  init();
  
})();

