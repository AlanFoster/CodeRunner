/**
 * Binds the DOM to interact with the code running emulating environment
 */
$(function () {
    function bindCodeRunners() {
        var codeRunners = $("[intepreter-runner]");

        // Each code runner will have metadata suggestion which environment it is related to
        codeRunners.each(function () {
            var runner = $(this);

            var targetId = runner.attr("intepreter-target");
            var target = $(targetId);

            var debugId = runner.attr("intepreter-debugger");
            var debugTarget = $(debugId);

            var environment = codeRunner.createEnvironment(target, debugTarget);

            // Bind a cancel button
            var cancelId = runner.attr("intepreter-stop");
            $(cancelId).click(function () {
                environment.destroy(true);
            });

            var codeBoxId = runner.attr("intepreter-code-box");

            runner.click((function (codeBoxId, debugId, environment) {
                var isFirstRun = true;
                return function () {
                    if (!isFirstRun) {
                        console.log("Destoying");
                        environment.destroy();
                    }
                    isFirstRun = false;

                    environment.setUp();

                    var codeBoxEditor = ace.edit(codeBoxId);
                    var text = codeBoxEditor.getSession().getValue();

                    environment.evaluate(text)
                }
            })(codeBoxId, debugId, environment));
        });
    }

    function bindApi() {
        $("[intepreter-api]").each(function() {
            $(this).append("TODO Bind Available API")
        })
    }


    bindCodeRunners();
    bindApi();
});