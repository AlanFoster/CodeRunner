var Vector = (function(x, y){
    this.x = x;
    this.y = y;
});

Vector.prototype.toString = function(){
    return "[Vector x : " + this.x + ", y : " + this.y + "]";
};

var AABB = function(x1, y1, x2, y2){
    this.one = new Vector(x1, y1);
    this.two = new Vector(x2, y2);
};

AABB.prototype = {
    getDimension :
        function(){
            return new Vector((this.two.x - this.one.x), (this.two.y - this.one.y));
        },
    getCenter :
        function(){
            return new Vector(0.5 * (this.one.x + this.two.x), 0.5 * (this.one.y + this.two.y));
        },
    getHalfDimension :
        function(){
            return new Vector((this.two.x - this.one.x) / 2, (this.two.y - this.one.y) / 2);
        },
    containsPoint :
        function(point){
            return point.x >= this.one.x && point.x <= this.two.x
                && point.y >= this.one.y && point.y <= this.two.y;
        },
    intersectsAABB :
        function(other){
            return this.one.x < other.two.x && this.two.x > other.one.x
                && this.one.y < other.two.y && this.two.y > other.one.y;
        }
};

var codeRunner = (function (codeRunner) {

    // Public API for the DSL
    var Colors = {
        RED: "#FF0000",
        GREEN: "#00FF00",
        BLUE: "#0000FF",
        BLACK: "#000000"
    };

    var Keys = {
        UP: 38,
        LEFT: 37,
        RIGHT: 39,
        DOWN: 40
    };


    var availableEntities = {
        "Rectangle": {
            "description": "Creates a new Rectangle",
            "defaults": {
                "x": {"default": 10, "description": "Defines X, the top left position of this shape"},
                "y": {"default": 20, "description": "Defines Y, the top left position of this shape"},

                "width": {"default": 100, "description": "Defines the width of this shape"},
                "height": {"default": 100, "description": "Defines the height of this shape"},

                "color": {"default": Colors.BLUE, "description": "The color that this shape will be. Notice how it is spelt 'color', with American spelling."}
            }
        },

        "Text": {
            "description": "Creates a new piece of Text label",
            "defaults": {
                "x": {"default": 50, "description": "Defines X, the top left position of this shape"},
                "y": {"default": 50, "description": "Defines Y, the top left position of this shape"},
              
			    // TODO Hardcoded - could be automatically generated when text is set.
                "width": {"default": 100, "description": "Defines the width of this shape"},
                "height": {"default": 20, "description": "Defines the height of this shape"},

                "color": {"default": Colors.BLACK, "description": "The color that this shape will be. Notice how it is spelt 'color', with American spelling."},
                "text": {"default": "[Text Label]", "description": "The text to show the user"}
            }
        },

        "Circle": {
            "description": "Creates a new Rectangle",
            "defaults": {
                "x": {"default": 50, "description": "Defines X, the top left position of this shape"},
                "y": {"default": 50, "description": "Defines Y, the top left position of this shape"},
                "radius": {"default": 40, "description": "The radius of the circle"},
                "color": {"default": Colors.BLUE, "description": "The color that this shape will be. Notice how it is spelt 'color', with American spelling."}
            }
        }
    };
	
    // Expose the available API
    codeRunner.api = [];

    codeRunner.api.push({availableEntities: availableEntities});
    codeRunner.api.push({colors: Colors});
    codeRunner.api.push({keys: Keys});


    var SUPPORTED_LOGGERS = [
        "log",
        "error",
        "debug"
    ];

    var stringify = function (args) {
        if (!args) {
            return  "[Null]"
        }
        var toString = args.toString();
        if (toString === "[object Object]") {
            return JSON.stringify(args, null, 4)
        } else {
            return toString
        }
    };

    var DEFAULT_DEBUGGER = SUPPORTED_LOGGERS.reduce(function (acc, name) {
            acc[name] = function (args) {
                console.log(stringify(args))
            };
            return acc;
        },
        {
            clear: function () {
                /* noop */
            }
        });

    var HTML_LOGGER = function (target) {
        var count = 1;

        function appendLog(args, level) {
            // Attempt to stringify the args
            var string = stringify(args);

            // Append the log message at the required level and scroll to the bottons
            var html = "<span class='logging-" + level + "'>[" + count + "] " + string + "</span><br />";
            target.append(html);
            target.scrollTop(target.get(0).scrollHeight);
            count++;
        }

        return SUPPORTED_LOGGERS.reduce(function (acc, name) {
            acc[name] = function (args) {
                appendLog(args, name);
            };
            return acc;
        }, {
            clear: function () {
                count = 1;
                target.html();
            }
        });
    };

    // A custom environment for each debugging example
    function Environment(container, debugTarget) {
        var WORLD_WIDTH;
        var WORLD_HEIGHT;
        var context;
        var gameLoop;
        var keysDown = {};

        window.addEventListener("keydown", function (event) {
            keysDown[event.keyCode] = true;
        });

        window.addEventListener("keyup", function (event) {
            delete keysDown[event.keyCode];
        });

        var logger = (function (target) {
            if (target) {
                return HTML_LOGGER(target);
            } else {
                return DEFAULT_DEBUGGER;
            }
        })(debugTarget);

        var log = function (args) {
            logger.log(args);
        };
        var debug = function (args) {
            logger.debug(args)
        };
        var error = function (args) {
            logger.error(args)
        };

        var entities = [];

        function bindProperties(obj, defaults, attributes) {
            var props = $.extend(defaults, attributes)

            for (var prop in props) {
                if (!props.hasOwnProperty(prop)) continue;

                var val = props[prop];
                obj[prop] = val;
                logger.log("Creating property " + prop + " with value " + val);
            }

            return obj;
        }

        function mapDefaults(defaults) {
            var result = [];
            for(var key in defaults) {
                result[key] = defaults[key].default;
            }
            return result;
        }

		// TODO Write base entity.
		
        var Rectangle = (function () {
            var defaults = mapDefaults(availableEntities.Rectangle.defaults)

            function Rectangle(attributes) {
                logger.log("Creating Rectangle!");
                bindProperties(this, defaults, attributes);
                logger.log("Successfully created Rectangle!");
            }

            Rectangle.prototype = {
                render: function (context, width, height) {
                    context.fillStyle = this.color;
                    context.fillRect(this.x, this.y, this.width, this.height)
                },
                collidesWith: function(other) {
                    var thisBounds = this.getBounds();
                    var otherBounds = other.getBounds();
                    return thisBounds.intersectsAABB(otherBounds)
                },
                getBounds: function() {
                    return new AABB(this.x, this.y, this.x + this.width, this.y + this.height)
                }
            };

            return function (attributes) {
                var instance = new Rectangle(attributes);
                entities.push(instance);
                return instance;
            }
        })();

        var Text = (function () {
            var defaults = mapDefaults(availableEntities.Text.defaults)

            function Text(attributes) {
                logger.log("Creating Text!");
                bindProperties(this, defaults, attributes);
                logger.log("Successfully created Text!");
            }

            Text.prototype = {
                render: function (context, width, height) {
                    context.fillStyle = this.color;
                    context.font = this.size + 'pt Calibri';
                    context.fillText(this.text, this.x, this.y)
                },
                collidesWith: function(other) {
                    var thisBounds = this.getBounds();
                    var otherBounds = other.getBounds();
                    return thisBounds.intersectsAABB(otherBounds)
                },
                getBounds: function() {
                    return new AABB(this.x, this.y, this.x + this.width, this.y + this.height)
                }
            };

            return function (attributes) {
                var instance = new Text(attributes);
                entities.push(instance);
                return instance;
            }
        })();

        var Circle = (function () {
            var defaults = mapDefaults(availableEntities.Circle.defaults)

            function Circle(attributes) {
                logger.log("Creating Circle!");
                bindProperties(this, defaults, attributes)
                logger.log("Successfully created Circle!");
            }

            Circle.prototype = {
                render: function (context, width, height) {
                    context.beginPath();
                    context.arc(this.x, this.y, this.radius, 2 * Math.PI, false);
                    context.fillStyle = this.color;
                    context.fill();
                },
                collidesWith: function(other) {
                    var thisBounds = this.getBounds();
                    var otherBounds = other.getBounds();
                    return thisBounds.intersectsAABB(otherBounds)
                },
                getBounds: function() {
                    var x = this.x - this.radius;
                    var y = this.y - this.radius;

                    return new AABB(x, y, x + (this.radius * 2), y + (this.radius * 2));
                }
            };

            return function (attributes) {
                var instance = new Circle(attributes);
                entities.push(instance);
                return instance;
            }
        })();

        function update() {
            // noop implementation by default
        }

        function render(context, width, height) {
            if (!context) return;

            context.fillStyle = "#FF00FF";
            context.fillRect(0, 0, width, height);

            // Draw entities as expected
            entities.forEach(function (entity, width, height) {
                entity.render(context)
            })
        }

        return {
            setUp: function () {
                // Create a graphical component for our container
                var canvas = document.createElement("canvas");

                WORLD_WIDTH = Math.ceil(container.width());
                WORLD_HEIGHT = Math.ceil(container.height());

                canvas.width = WORLD_WIDTH;
                canvas.height = WORLD_HEIGHT;

                // Set the global context
                context = canvas.getContext("2d");

                container.html("");
                container.append(canvas);
            },
            evaluate: function (rawCode) {
                logger.log("Runnning new Program!");

                try {
                    eval(rawCode);

                    logger.log("Successfully Setup")
                } catch (e) {
                    console.log(e);
                    logger.error("Error :: " + e.stack);
                }

                // TODO use request animation frame...
                gameLoop = setInterval(function () {
                    try {
                        update();
                        render(context, WORLD_WIDTH, WORLD_HEIGHT)
                    } catch (e) {
                        console.log(e);
                        logger.error("Error :: " + e.stack);
                    }
                }, 40);
            },
            destroy: function (keepLogs) {
                if(gameLoop) {
                    clearInterval(gameLoop);
                }

                if (!keepLogs) {
                    logger.clear()
                }
                entities.splice(0, entities.length)
            }
        };
    }

    return {
        createEnvironment: function (container, debugTarget) {
            return new Environment(container, debugTarget);
        }
    };
})(codeRunner || (codeRunner = {}));