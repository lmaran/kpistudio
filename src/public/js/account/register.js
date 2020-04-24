(function() {
    var formEl;
    var emailEl, emailFg, emailErr;
    var pswEl, pswFg, pswErr;

    // DOM ready
    $(function() {
        // def
        formEl = $("form");

        emailEl = $("[name='email']");
        emailFg = $("#emailFg");
        emailErr = $("#emailErr");

        pswEl = $("[name='password']");
        pswFg = $("#pswFg");
        pswErr = $("#pswErr");

        // events
        formEl.submit(onSubmitForm);
    });

    function onSubmitForm(event) {
        event.preventDefault();

        $.when(checkEmail(), checkPsw()).done(function(v1, v2) {
            if (v1 && v2) {
                //alert('ok');
                saveUser();
            }
        });
    }

    function saveUser() {
        var url = "/signup";

        var data = {
            email: emailEl.val(),
            password: pswEl.val()
        };

        $.post(url, data)
            .done(function() {
                document.location.href = "/"; // redirect to homepage
            })
            .fail(function(err) {
                alert(err);
            });
    }

    function checkEmail() {
        var dfd = $.Deferred();

        // reset validation errors
        emailFg.removeClass("has-error");
        emailErr.text("");

        if (emailEl.val() == "") {
            emailFg.addClass("has-error");
            emailErr.text("Acest camp este obligatoriu.");
            emailEl.focus();
            dfd.resolve(false);
        } else if (!isEmail(emailEl.val())) {
            emailFg.addClass("has-error");
            emailErr.text("Adresa de email invalida.");
            emailEl.focus();
            dfd.resolve(false);
        } else {
            var url = "/api/users/checkemail/" + emailEl.val();
            $.get(url, function(result) {
                if (!result) {
                    // result = false if email is not present in Users DB
                    var url2 = "/api/customerEmployees/checkemail/" + emailEl.val();
                    $.get(url2, function(result2) {
                        if (!result2) {
                            // result = false if email is not present in Customers DB
                            emailFg.addClass("has-error");
                            emailErr.html(
                                "Adresa de email necunoscuta.  </br> Va rog sa comunicati aceasta adresa la cantina, spre inregistrare."
                            );
                            emailEl.focus();
                            dfd.resolve(false);
                        } else {
                            dfd.resolve(true);
                        }
                    });
                } else {
                    emailFg.addClass("has-error");
                    emailErr.html("Exista deja un cont cu aceasta adresa de email.");
                    emailEl.focus();
                    dfd.resolve(false);
                }
            });
        }

        return dfd.promise();
    }

    function checkPsw() {
        var dfd = $.Deferred();

        // reset validation errors
        pswFg.removeClass("has-error");
        pswErr.text("");

        if (pswEl.val() == "") {
            pswFg.addClass("has-error");
            pswErr.text("Acest camp este obligatoriu.");
            pswEl.focus();
            dfd.resolve(false);
        } else if (pswEl.val().length < 6) {
            pswFg.addClass("has-error");
            pswErr.text("Minim 6 caractere.");
            pswEl.focus();
            dfd.resolve(false);
        } else {
            dfd.resolve(true);
        }

        return dfd.promise();
    }

    function isEmail(email) {
        // http://stackoverflow.com/a/46181/2726725
        var re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        return re.test(email);
    }
})();

// (function(){
//     var emailEl, emailGlyphOkEl, emailGlyphWarnEl;

//     // DOM ready
//     document.addEventListener("DOMContentLoaded", function(event) {
//         emailEl = document.getElementById('email');
//         emailEl.addEventListener("change", onChangeEmail);

//         emailGlyphOkEl = document.getElementById('emailGlyphOk');
//         emailGlyphOkEl.style.visibility="hidden";

//         emailGlyphWarnEl = document.getElementById('emailGlyphWarn');
//         emailGlyphWarnEl.style.visibility="hidden";
//     });

//     function onChangeEmail() {
//         checkEmail(emailEl.value, function(result){
//             if(result === 'true'){ // email is present in DB
//                 emailGlyphOkEl.style.visibility="visible";
//                 emailGlyphWarnEl.style.visibility="hidden";
//             } else{
//                 emailGlyphOkEl.style.visibility="hidden";
//                 emailGlyphWarnEl.style.visibility="visible";
//             }
//         });
//     }

//     function checkEmail(email, cb) {
//         var xhttp = new XMLHttpRequest();
//         var url = "/api/customerEmployees/checkemail/" + email;
//         xhttp.onreadystatechange = function() {
//             if (xhttp.readyState == 4 && xhttp.status == 200) {
//                 cb(xhttp.responseText);
//             }
//         };
//         xhttp.open("GET", url);
//         xhttp.send();
//     }
// })();
