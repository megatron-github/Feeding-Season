function Germ(x, y, dna) {
  // The 'Germ' class object

  this.acceleration = createVector(0, 0); // acceleration of a moving germ
  this.velocity = createVector(0, -2);    // speed + direction of a moving germ
  this.position = createVector(x, y);     // direction of a moving germ
  this.r = 4;             // size of the germ
  this.maxspeed = 5;      // germ can only move at most 5 pixels at a time
  this.maxforce = 0.5;    // force to keep germ moving
  this.health = 1;        // health: helps decide the germ's stage of life
  this.dna = [];          // DNA: helps decide germ's behaviors

  // if germ was created randomly by user or
  // at the beginning of the program
  if (dna == undefined) {
    this.dna[0] = random(-2, 2); // food attraction rate (steering force)
    this.dna[1] = random(-2, 2); // poison attraction rate (steering force)
    this.dna[2] = random(0, 107); // food recognition radius
    this.dna[3] = random(0, 107); // poison recognition radius

    // if the germ was cloned from another germ and
    // has some DNA information
  } else {
    for (var i = 0; i < dna.length; i++) { // for each DNA data
      this.dna[i] = dna[i]; // copy the DNA data
      if (random(1) < mutationRate) { // if chance of mutation is met
        if (i <= 1) { // adjust the first two data
          this.dna[i] += random(-0.1, 0.1);
        } else if (i > 1) { // adjust the last two data

          // keep the last two data to be always positive
          // and within the range of 0 - 150
          this.dna[i] = (this.dna[i] + random(-10, 10)) % 107;
        }
      }
    }
  }

  this.display = function() {
    // method to add the germ to the HTML and display it

    // create an angle in the direction of velocity of the germ
    var angle = this.velocity.heading() + PI / 2;

    push();

    // translate the object germ's position
    translate(this.position.x, this.position.y);

    // turn the object germ by angle
    rotate(angle);

    // create an animation of the object germ's health by color
    colorMode(RGB);
    var good = color(255, 79, 0); // healthy germ has orange color
    var bad = color(0, 203, 201); // dying germ has ligth blue color

    // Node.js lerpColor create a gradient of color from dying to healthy,
    // and define the color of the germ according to germ's health
    var currentState = lerpColor(bad, good, this.health);

    // setting the interior of a shape (fill) to a health-based color
    fill(currentState);

    // setting outline (stroke) to a health-based color
    stroke(currentState);

    // drawing the germ
    strokeWeight(10);
    line(0, -this.r * 2, 0, this.r * 2);

    if(showDNA){                         // drawing the germ's DNA data
    strokeWeight(3);
    noFill();
    stroke(255, 255, 0);
    line(0, 0, 0, -this.dna[0] * 15);  // drawing germ's food attraction force
    ellipse(0, 0, this.dna[2]);        // drawing germ's food perception range
    strokeWeight(1);
    stroke(255, 0, 0);
    line(0, 0, 0, -this.dna[1] * 15); // drawing germ's poison attraction force
    ellipse(0, 0, this.dna[3]);       // drawing germ's poison perception range
    }
    pop();
  }

  this.update = function() {
    // method to update location, velocity, and
    // health of the object germ

    // health of germ is constantly decreasing unless
    // the germ ate some food
    this.health -= 0.008;

    // update velocity
    this.velocity.add(this.acceleration);

    // set speed limit
    this.velocity.limit(this.maxspeed);

    // move the germ location to its traveled distance
    this.position.add(this.velocity);

    // reset acceleration to 0 each cycle
    this.acceleration.mult(0);
  }

  this.applyForce = function(force) {
    // method to create acceleration to the object germ's velocity
    // help managing the steering force

    this.acceleration.add(force);
  }

  this.seek = function(target) {
    // a method that calculates a steering force toward a target:
    // steer = desired - velocity

    // a vector pointing from the location to the target
    var desired = p5.Vector.sub(target, this.position);

    // scale the desired direction to maximum speed
    desired.setMag(this.maxspeed);

    // steering = desired - velocity
    var steer = p5.Vector.sub(desired, this.velocity);

    // limit to max steering force to germ's maximum force
    steer.limit(this.maxforce);

    // return the steering direction that germ needs to find food
    return steer;
  }

  this.judgingCrave = function(foodList, nutrition, perception) {
    // method for object germ to determine its instinctive food
    // using the germ's DNA data

    var record = Infinity; // a record of the closest distance to food from the germ
    var closestFood = null; // the closest food

    // for each food in the display
    for (var i = foodList.length - 1; i >= 0; i--) {

      // find each distance of food from germ
      var d = this.position.dist(foodList[i]);

      // if some food is within germ's reach
      if (d <= this.maxspeed) {

        // let the germ eats the food
        foodList.splice(i, 1);

        // adjust the germ health by the food it ate
        this.health += nutrition;

        // if no food is within germ's reach
      } else {

        // make germ to move to the closest food that it can see
        if (d < record && d < perception) {

          // save the distance of food
          record = d;

          // save the food identity
          closestFood = foodList[i];
        }
      }
    }

    // If there is food in sight, then this is the moment of eating
    if (closestFood != null) {

      // get the direction germ should move to get food
      return this.seek(closestFood);
    }

    // if there is no food in sight, give germ some direction to move
    return createVector(0, 0);
  }

  this.applyBehaviors = function(good, bad) {
    // method to mange object germ to look for food and eat food, and
    // adjust the germ's behaviors toward certain type of food
    // by its DNA data

    // control the germ to stay inside the canvas
    this.stayinBoundaries();

    // get the germ's attraction toward good food
    var steerG = this.judgingCrave(good, 0.3, this.dna[2]);

    // get the germ's attraction toward bad food
    var steerB = this.judgingCrave(bad, -0.2, this.dna[3]);

    // multiply the germ's attractions to its DNA, to get the direction
    // and velocity that germ needs to pursue the food
    steerG.mult(this.dna[0]);
    steerB.mult(this.dna[1]);

    // apply the direction and the velocity to the germ
    this.applyForce(steerG);
    this.applyForce(steerB);
  }

  this.stayinBoundaries = function() {
    // method to keep object germ stay within the device screen

    var d = 27; // boundary: 20 pixels from the edge of the canvas
    var desired = null; // force to turn germ turn around as it reach to the edge

    // if germ's position is off from the edge on the left
    if (this.position.x < d) {

      // create a steering force to turn the germ to the rigth
      desired = createVector(this.maxspeed, this.velocity.y);
    }

    // if germ's position is off from the edge on the right
    else if (this.position.x > windowWidth - d) {

      // create a steering force to turn the germ to the left
      desired = createVector(-this.maxspeed, this.velocity.y);
    }

    // if germ's position is off from the edge on the top
    if (this.position.y < d) {

      // create a steering force to turn the germ to the bottom
      desired = createVector(this.velocity.x, this.maxspeed);
    }

    // if germ's position is off from the edge on the bottom
    else if (this.position.y > windowHeight - d) {

      // create a steering force to turn the germ to the top
      desired = createVector(this.velocity.x, -this.maxspeed);
    }

    // if the germ need to steer to another direction
    if (desired != null) {
      desired.setMag(this.maxspeed); // scale the desired direction to max speed

      // get the steering force (the germ's desired now should be
      // turn around from the edge)
      var steer = p5.Vector.sub(desired, this.velocity);

      steer.limit(this.maxforce); // get the germ's maximum force
      this.applyForce(steer); // turn the germ around with max force
    }
  }

  this.reproduce = function() {
    // method for the object germ to create a clone of itself

    // there is a 1% of chance the germ will clone itself, but
    // the germ also has to be at least 70% healthy to clone
    if (random(1) < 0.01 && this.health > 0.65) {

      // return the clone if all criterias met
      return new Germ(this.position.x, this.position.y, this.dna);
    }
    return null;
  }

  this.dead = function() {
    // a method for determine if the object germ is dead

    // return a boolean to determine
    // if the germ still has any health
    return (this.health <= 0);
  }
}
