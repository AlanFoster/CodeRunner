
var TutorialView = Backbone.View.extend({
    initialize: function() {
        var pages = this.$el.find(".page");
        pages.hide();

        this.pages = Array(pages.length)
        this.currentIndex = 0;
        this.animating = false;
    },
    render: function() {
        this.$el.find(".page").eq(this.currentIndex).show();
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

        var oldIndex = this.currentIndex;
        this.currentIndex = newIndex;
        // TODO - Perhaps we should be bound to a backbone model to get these events for free?
        this.trigger("change:currentIndex", newIndex);
        var pages = this.$el.find(".page")

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
        this.$el.html(rendered);

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
        var newValue = !this.detailOpened;
        this.renderDetail(newValue);
    }
})

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
})


var apiView = new ApiView({
    collection: apiTest,
    el: "[intepreter-api]"
})

apiView.render();