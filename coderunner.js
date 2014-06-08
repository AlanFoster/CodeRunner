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
        BLACK: "#000000",
        GREY: "#CCCCCC"
    };

    var Keys = {
        UP: 38,
        LEFT: 37,
        RIGHT: 39,
        DOWN: 40
    };

    var availableEntities = {};
	
    // Expose the available API
    var api = [];

    api.push({
        name: "Available Entities",
        description: "All information about the objects which can be created with this application",
        todoNameMe: availableEntities
    });
    api.push({
        name: "Colors",
        description: "How to create variable colours",
        todoNameMe: Colors
    });
    api.push({
        name: "Keys",
        description: "The keys which are available for use",
        todoNameMe: Keys
    });

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
                target.html("");
            }
        });
    };

    // TODO Should be unique for each environment
    var worldEntities = [];

    var Entity = (function(availableEntities, worldEntities){
        function bindProperties(obj, defaults, attributes) {
            var props = $.extend(defaults, attributes)

            for (var prop in props) {
                if (!props.hasOwnProperty(prop)) continue;

                var val = props[prop];
                obj[prop] = val;
                //logger.debug("Creating property " + prop + " with value " + val);
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

        function Entity(){

        }

        Entity.prototype = {
            collidesWith: function(other) {
                var thisBounds = this.getBounds();
                var otherBounds = other.getBounds();
                return thisBounds.intersectsAABB(otherBounds)
            },
            getBounds: function(){
                return new AABB(this.x, this.y, 0, 0);
            },
            render: function(context) {
                // noop
            }
        };

        Entity.extend = function(details) {
            var name = details.name;
            var description = details.description;
            var defaults = details.defaults;
            var functions = details.functions;

            // Make this new entity information available within the API
            availableEntities[name] = details;
            var mappedDefaults = mapDefaults(details.defaults);

            var F = function(attrs){
                //logger.debug("Creating a new : " + name);
                bindProperties(this, mappedDefaults, attrs);
                //logger.debug("Created a new : " + name);
            };

            F.prototype = functions;
            for(var key in Entity.prototype){
                if(!F.prototype.hasOwnProperty(key)) {
                    F.prototype[key] = Entity.prototype[key]
                }
            }

            return function(attributes) {
                var instance = new F(attributes);
                worldEntities.push(instance);
                return instance;
            };
        };

        return Entity;
    })(availableEntities, worldEntities);

    var Rectangle = Entity.extend({
        name: "Rectangle",
        description: "Creates a new Rectangle",
        functions: {
            render: function (context) {
                context.fillStyle = this.color;
                context.fillRect(this.x, this.y, this.width, this.height)
            },
            getBounds: function () {
                return new AABB(this.x, this.y, this.x + this.width, this.y + this.height)
            }
        },
        defaults: {
            "x": {"default": 10, "description": "Defines X, the top left position of this shape"},
            "y": {"default": 20, "description": "Defines Y, the top left position of this shape"},

            "width": {"default": 100, "description": "Defines the width of this shape"},
            "height": {"default": 100, "description": "Defines the height of this shape"},

            "color": {"default": Colors.BLUE, "description": "The color that this shape will be. Notice how it is spelt 'color', with American spelling."}
        }
    });

    var Text = Entity.extend({
        name: "Text",
        description: "Creates a Text label",
        functions: {
            render: function (context) {
                context.fillStyle = this.color;
                context.font = this.size + 'pt Calibri';
                context.fillText(this.text, this.x, this.y)
            },
            getBounds: function () {
                return new AABB(this.x, this.y, this.x + this.width, this.y + this.height)
            }
        },
        defaults: {
            "x": {"default": 50, "description": "Defines X, the top left position of this shape"},
            "y": {"default": 50, "description": "Defines Y, the top left position of this shape"},

            // TODO Hardcoded - could be automatically generated when text is set.
            "width": {"default": 100, "description": "Defines the width of this shape"},
            "height": {"default": 20, "description": "Defines the height of this shape"},

            "color": {"default": Colors.BLACK, "description": "The color that this shape will be. Notice how it is spelt 'color', with American spelling."},
            "text": {"default": "[Text Label]", "description": "The text to show the user"}
        }
    });

    var Circle = Entity.extend({
        name: "Circle",
        description: "Creates a new Rectangle",
        functions: {
            render: function (context) {
                context.beginPath();
                context.arc(this.x, this.y, this.radius, 2 * Math.PI, false);
                context.fillStyle = this.color;
                context.fill();
            },
            getBounds: function () {
                var x = this.x - this.radius;
                var y = this.y - this.radius;

                return new AABB(x, y, x + (this.radius * 2), y + (this.radius * 2));
            }
        },
        defaults: {
            "x": {"default": 50, "description": "Defines X, the top left position of this shape"},
            "y": {"default": 50, "description": "Defines Y, the top left position of this shape"},
            "radius": {"default": 40, "description": "The radius of the circle"},
            "color": {"default": Colors.BLUE, "description": "The color that this shape will be. Notice how it is spelt 'color', with American spelling."}
        }
    });

    // A custom environment for each debugging example
    function Environment(container, debugTarget) {
        var world = {
            color: Colors.GREY,
            // Computed on setup
            width: 0,
            height: 0
        };

        var context;
        var gameLoop;
        var keysDown = {};
        keysDown.contains = function(key) { return this[key]; };

        $(window).keydown(function (event) {
            keysDown[event.which] = true;
            return true;
        });

        $(window).keyup(function (event) {
            delete keysDown[event.which];
        });

        var logger = (function (target) {
            if (target) {
                return HTML_LOGGER(target);
            } else {
                return DEFAULT_DEBUGGER;
            }
        })(debugTarget);

        // Bind the available logging functions to this scope
        // Ie so it can be access with `log("...")` for the end user
/*        $.each(SUPPORTED_LOGGERS, function(i, loggingType) {
            self[loggingType] = function(args) {
                logger[loggingType](args)
            }
        });*/

        var log = function (args) {
            logger.log(args);
        };
        var debug = function (args) {
            logger.debug(args)
        };
        var error = function (args) {
            logger.error(args)
        };

        function update() {
            // noop implementation by default
        }

        function render(context, width, height) {
            if (!context) return;

            context.fillStyle = world.color;
            context.fillRect(0, 0, width, height);

            // Draw entities as expected
            worldEntities.forEach(function (entity) {
                entity.render(context)
            })
        }

        return {
            setUp: function () {
                // Create a graphical component for our container
                var canvas = document.createElement("canvas");

                world.width = Math.ceil(container.width());
                world.height = Math.ceil(container.height());

                canvas.width = world.width;
                canvas.height = world.height;

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
                        render(context, world.width, world.height)
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
                worldEntities.splice(0, worldEntities.length)
            }
        };
    }

    return {
        createEnvironment: function (container, debugTarget) {
            return new Environment(container, debugTarget);
        },
        api: api
    };
})(codeRunner || (codeRunner = {}));