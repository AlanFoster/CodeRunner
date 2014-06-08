
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