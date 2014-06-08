var TutorialView = Backbone.View.extend({
    initialize: function() {
        var pages = this.$el.find(".page");
        pages.hide();

        this.pages = Array(pages.length)
        this.currentIndex = 0;
        this.animating = false;
    },
    render: function() {
        this.$el.find(".page").eq(0).show();
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
        var pages = this.$el.find(".page")

        var self = this;
        pages.eq(oldIndex).fadeOut(function(){
            console.log("call back")
            pages.eq(newIndex).fadeIn(function() {
                self.animating = false;
            });
        })
    }
})

var tutorialView = new TutorialView({
    el: "#tutorial-box"
});
tutorialView.render();