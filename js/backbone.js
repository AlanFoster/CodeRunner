var TutorialView = Backbone.View.extend({
    initialize: function() {
        var pages = this.$el.find(".page");
        pages.hide();

        this.pages = Array(pages.length)
        this.currentIndex = 0;
        this.animating = false;
    },
    render: function() {
        this.showPage(0);

        return this;
    },
    events: {
        "click .nextPage": "nextPage",
        "click .previousPage": "previousPage"
    },
    nextPage: function(e) {
        if(this.animating) return;

        var currentIndex = this.currentIndex;
        var newIndex = (currentIndex + 1) % this.pages.length;
        this.showPage(newIndex);
    },
    previousPage: function(e) {
        if(this.animating) return;

        var currentIndex = this.currentIndex;
        var newIndex = (currentIndex === 0)
            ? this.pages.length - 1
            : currentIndex - 1;
        this.showPage(newIndex);
    },
    showPage: function(newIndex) {
        if(this.animating) return;

        this.animating = true;

        var isPreviousAllowed = newIndex > 0;
        this.$el.find(".previousPage")[isPreviousAllowed ? "show" : "hide"]();

        var isNextAllowed = newIndex != (this.pages.length - 1);
        this.$el.find(".nextPage")[isNextAllowed ? "show" : "hide"]();

        var oldIndex = this.currentIndex;
        this.currentIndex = newIndex;
        // TODO - Perhaps we should be bound to a backbone model to get these events for free?
        this.trigger("change:currentIndex", newIndex);
        var pages = this.$el.find(".page");

        var self = this;
        pages.eq(oldIndex).fadeOut(function(){
            pages.eq(newIndex).fadeIn(function() {
                self.animating = false;
            });
        })
    }
})

var tutorialView = new TutorialView({
    el: "#tutorial-box"
});


var CodeRouter = Backbone.Router.extend({
    routes: {
        "snippet/:id": "viewSnippet"
    },
    viewSnippet: function(id) {
        tutorialView.showPage(id);
    }
});

var codeRouter = new CodeRouter();
Backbone.history.start();

// Bind a listener to the carousel so that when it changes
// we update the routing information
tutorialView.on("change:currentIndex", function(newIndex){
    codeRouter.navigate("snippet/" + newIndex);
});

// Render our views
tutorialView.render();


// Try to bind the public API
var ApiModel = Backbone.Model.extend({
    defaults: {
        name: "Not Set",
        description: "",
        todoNameMe: {}
    }
});
var ApiCollection = Backbone.Collection.extend({
    model: ApiModel
});

var apiTest = new ApiCollection(codeRunner.api);


var ApiOverview = Backbone.View.extend({
    template: _.template($("#api-overview").html()),
    templateDetail: _.template($("#api-detail").html()),
    initialize: function(){
        this.detailOpened = false;
        this.renderedDetail = false;
    },
    render: function() {
        var rendered = this.template(
            _.extend(this.model.toJSON(), { detailOpened: this.detailOpened})
        );
        // Replace the existing $el, so we don't have a wrapped div.
        this.setElement(rendered);

        this.$el.find(".more-detail").hide();
        this.renderDetail(false);

        return this;
    },
    renderDetail: function(newValue) {
        if(newValue === this.detailOpened) return;

        if(!this.renderedDetail && newValue) {
            this.renderedDetail = true;
            var detail = this.templateDetail(this.model.toJSON());
            this.$el.find(".more-detail").html(detail);
        }

        if(this.renderedDetail) {
            var toggleValue = ["hide", "show"][+newValue];
            this.$el.find(".more-detail")[toggleValue]();
        }

        this.detailOpened = newValue;
    },
    events: {
        "click .more": "viewMore"
    },
    viewMore: function(e) {
        e.preventDefault();
        var newValue = !this.detailOpened;
        this.renderDetail(newValue);
    }
});

var ApiView = Backbone.View.extend({
    // collection: {},
    initialize: function() {

    },
    render: function() {
        var self = this
        _.each(this.collection.models, function(item) {
            var apiExample = new ApiOverview({
                model: item
            })
            self.$el.append(apiExample.render().el)
        });
        return this;
    }
});

var apiView = new ApiView({
    collection: apiTest,
    el: "[intepreter-api]"
});

apiView.render();

var CodeExample = (function() {
    var createId = (function() {
        var id = 0;
        return function() {
            id++;
            return "CodeExample-" + id;
        }
    })();

    var CodeByExample = Backbone.View.extend({
        tagName: "div",
        // target: "#...",
        template: _.template($("#code-editor-template").html()),
        initialize: function(){

        },
        events: {
            "click .copyCode": "copyCode"
        },
        copyCode: function(e) {
            var currentEditor = ace.edit(this.editorId);
            var currentValue = currentEditor.getSession().getValue();

            var targetEditor = ace.edit("code-box");
            var targetSession = targetEditor.getSession();
            targetSession.setValue(currentValue)
            targetEditor.focus();
            targetEditor.navigateFileEnd();
        },
        render: function() {
            var code = this.$el.text();

            // Attempts to shift all code to the left of the editor, ie removing the appropriate level of whitespace
            var formattedCode = (function(code) {
                var formattedCode = code.split("\n").reduce(function(prev, nextLine) {
                    if(!prev.foundFirstLine) {
                        var isBlank = nextLine.trim() === "";
                        if(isBlank) {
                            return prev;
                        }

                        prev.foundFirstLine = true;
                        prev.leadingWhiteSpace = nextLine.length - nextLine.trim().length;
                    }

                    prev.combined += (nextLine.length > prev.leadingWhiteSpace)
                            ? "\n" + nextLine.substr(prev.leadingWhiteSpace)
                            : "\n" + nextLine;

                    return prev;
                }, {foundFirstLine: false, leadingWhiteSpace: 0, combined: ""}).combined;

                return formattedCode;
            })(code);

            var editorId = createId();
            this.editorId = editorId;

            this.$el.html(this.template({
                id: editorId,
                code: _.escape(formattedCode)
            }));

            // Create the ace editor
            var aceEditor = ace.edit(editorId);
            aceEditor.setOptions({
                maxLines: 15
            });
            aceEditor.setTheme(editorStyle);
            aceEditor.getSession().setMode("ace/mode/javascript");
            return this;
        }
    });

    return CodeByExample;
})();

$("[code-example]").each(function() {
    new CodeExample({el: $(this), target: "code-box"}).render();
});

$.fn.flash = function()
{
    var originalBg = this.css("backgroundColor") || "#FFFFFF";
    this
        .css("background-color", "#D3F5E5")
        .animate({backgroundColor: originalBg}, 700);

    return this;
};

$("[highlight-target]").each(function() {
    $(this).click(function(e) {
        e.preventDefault();
        var target = $(this).attr("highlight-target")
        $(target).flash();
    })
})