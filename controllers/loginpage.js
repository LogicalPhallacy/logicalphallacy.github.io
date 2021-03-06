define(["appSettings", "dom", "connectionManager", "loading", "cardStyle", "emby-checkbox"], function(appSettings, dom, connectionManager, loading) {
    "use strict";

    function authenticateUserByName(page, apiClient, username, password) {
        loading.show(), apiClient.authenticateUserByName(username, password).then(function(result) {
            var newUrl, user = result.User,
                serverId = getParameterByName("serverid");
            newUrl = user.Policy.IsAdministrator && !serverId ? "dashboard.html" : "home.html", loading.hide(), Dashboard.onServerChanged(user.Id, result.AccessToken, apiClient), Dashboard.navigate(newUrl)
        }, function(response) {
            page.querySelector("#txtManualName").value = "", page.querySelector("#txtManualPassword").value = "", loading.hide(), 401 == response.status ? require(["toast"], function(toast) {
                toast(Globalize.translate("MessageInvalidUser"))
            }) : showServerConnectionFailure()
        })
    }

    function showServerConnectionFailure() {
        Dashboard.alert({
            message: Globalize.translate("MessageUnableToConnectToServer"),
            title: Globalize.translate("HeaderConnectionFailure")
        })
    }

    function showManualForm(context, showCancel, focusPassword) {
        context.querySelector(".chkRememberLogin").checked = appSettings.enableAutoLogin(), context.querySelector(".manualLoginForm").classList.remove("hide"), context.querySelector(".visualLoginForm").classList.add("hide"), focusPassword ? context.querySelector("#txtManualPassword").focus() : context.querySelector("#txtManualName").focus(), showCancel ? context.querySelector(".btnCancel").classList.remove("hide") : context.querySelector(".btnCancel").classList.add("hide")
    }

    function getRandomMetroColor() {
        var index = Math.floor(Math.random() * (metroColors.length - 1));
        return metroColors[index]
    }

    function getMetroColor(str) {
        if (str) {
            for (var character = String(str.substr(0, 1).charCodeAt()), sum = 0, i = 0; i < character.length; i++) sum += parseInt(character.charAt(i));
            var index = String(sum).substr(-1);
            return metroColors[index]
        }
        return getRandomMetroColor()
    }

    function loadUserList(context, apiClient, users) {
        for (var html = "", i = 0, length = users.length; i < length; i++) {
            var user = users[i];
            html += '<button type="button" class="card squareCard scalableCard squareCard-scalable"><div class="cardBox cardBox-bottompadded">', html += '<div class="cardScalable">', html += '<div class="cardPadder cardPadder-square"></div>', html += '<div class="cardContent" data-haspw="' + user.HasPassword + '" data-username="' + user.Name + '" data-userid="' + user.Id + '">';
            var imgUrl;
            if (user.PrimaryImageTag) imgUrl = apiClient.getUserImageUrl(user.Id, {
                width: 300,
                tag: user.PrimaryImageTag,
                type: "Primary"
            }), html += '<div class="cardImageContainer coveredImage coveredImage-noScale" style="background-image:url(\'' + imgUrl + "');\"></div>";
            else {
                var background = getMetroColor(user.Id);
                imgUrl = "css/images/logindefault.png", html += '<div class="cardImageContainer coveredImage coveredImage-noScale" style="background-image:url(\'' + imgUrl + "');background-color:" + background + ';"></div>'
            }
            html += "</div>", html += "</div>", html += '<div class="cardFooter visualCardBox-cardFooter">', html += '<div class="cardText singleCardText cardTextCentered">' + user.Name + "</div>", html += "</div>", html += "</div>", html += "</button>"
        }
        context.querySelector("#divUsers").innerHTML = html
    }
    var metroColors = ["#6FBD45", "#4BB3DD", "#4164A5", "#E12026", "#800080", "#E1B222", "#008040", "#0094FF", "#FF00C7", "#FF870F", "#7F0037"];
    return function(view, params) {
        function getApiClient() {
            var serverId = params.serverid;
            return serverId ? connectionManager.getOrCreateApiClient(serverId) : ApiClient
        }

        function showVisualForm() {
            view.querySelector(".visualLoginForm").classList.remove("hide"), view.querySelector(".manualLoginForm").classList.add("hide")
        }
        view.querySelector("#divUsers").addEventListener("click", function(e) {
            var card = dom.parentWithClass(e.target, "card"),
                cardContent = card ? card.querySelector(".cardContent") : null;
            if (cardContent) {
                var context = view,
                    id = cardContent.getAttribute("data-userid"),
                    name = cardContent.getAttribute("data-username"),
                    haspw = cardContent.getAttribute("data-haspw");
                "manual" == id ? (context.querySelector("#txtManualName").value = "", showManualForm(context, !0)) : "false" == haspw ? authenticateUserByName(context, getApiClient(), name, "") : (context.querySelector("#txtManualName").value = name, context.querySelector("#txtManualPassword").value = "", showManualForm(context, !0, !0))
            }
        }), view.querySelector(".manualLoginForm").addEventListener("submit", function(e) {
            appSettings.enableAutoLogin(view.querySelector(".chkRememberLogin").checked);
            var apiClient = getApiClient();
            return authenticateUserByName(view, apiClient, view.querySelector("#txtManualName").value, view.querySelector("#txtManualPassword").value), e.preventDefault(), !1
        }), view.querySelector(".btnForgotPassword").addEventListener("click", function() {
            Dashboard.navigate("forgotpassword.html")
        }), view.querySelector(".btnCancel").addEventListener("click", showVisualForm), view.querySelector(".btnManual").addEventListener("click", function() {
            view.querySelector("#txtManualName").value = "", showManualForm(view, !0)
        }), view.addEventListener("viewshow", function(e) {
            loading.show();
            var apiClient = getApiClient();
            apiClient.getPublicUsers().then(function(users) {debugger;
                if (users.length) {
                    if (users[0].EnableAutoLogin) {
                        authenticateUserByName(view, apiClient, users[0].Name, "");
                    } else {
                        showVisualForm();
                        loadUserList(view, apiClient, users);
                    }
                } else {
                    view.querySelector("#txtManualName").value = "";
                    showManualForm(view, false, false);
                }

            }).finally(function () {
                loading.hide();
            });

            apiClient.getJSON(apiClient.getUrl("Branding/Configuration")).then(function(options) {
                view.querySelector(".disclaimer").textContent = options.LoginDisclaimer || ""
            });
        });
    }
});