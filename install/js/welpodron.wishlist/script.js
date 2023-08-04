"use strict";
(() => {
    if (!window.welpodron) {
        window.welpodron = {};
    }
    if (window.welpodron.wishlist) {
        return;
    }
    class Wishlist {
        sessid = "";
        items = new Set();
        supportedActions = ["toggle"];
        // isLoading = false;
        constructor({ sessid, items, config = {} }) {
            if (Wishlist.instance) {
                return Wishlist.instance;
            }
            this.setSessid(sessid);
            this.setItems(items);
            if (document.readyState === "complete" ||
                document.readyState === "interactive") {
                this.handleDocumentLoaded();
            }
            else {
                document.addEventListener("DOMContentLoaded", this.handleDocumentLoaded, {
                    once: true,
                });
            }
            document.removeEventListener("click", this.handleDocumentClick);
            document.addEventListener("click", this.handleDocumentClick);
            if (window.JCCatalogItem) {
                window.JCCatalogItem.prototype.changeInfo =
                    this.handleOfferChange(window.JCCatalogItem.prototype.changeInfo);
            }
            if (window.JCCatalogElement) {
                window.JCCatalogElement.prototype.changeInfo =
                    this.handleOfferChange(window.JCCatalogElement.prototype.changeInfo);
            }
            Wishlist.instance = this;
        }
        handleDocumentLoaded = () => {
            document
                .querySelectorAll("[data-w-wishlist-action-args][data-w-wishlist-action][data-w-wishlist-control]")
                .forEach((element) => {
                const actionArgs = element.getAttribute("data-w-wishlist-action-args");
                if (!actionArgs) {
                    return;
                }
                const labels = element.querySelectorAll("[data-w-wishlist-control-label]");
                if (this.items.has(actionArgs)) {
                    element.setAttribute("data-w-wishlist-control-active", "");
                    labels.forEach((label) => {
                        label.textContent = "В избранном";
                    });
                }
                else {
                    element.removeAttribute("data-w-wishlist-control-active");
                    labels.forEach((label) => {
                        label.textContent = "В избранное";
                    });
                }
            });
        };
        handleDocumentClick = (event) => {
            let { target } = event;
            if (!target) {
                return;
            }
            target = target.closest(`[data-w-wishlist-action-args][data-w-wishlist-action][data-w-wishlist-control]`);
            if (!target) {
                return;
            }
            const action = target.getAttribute("data-w-wishlist-action");
            const actionArgs = target.getAttribute("data-w-wishlist-action-args");
            if (!actionArgs) {
                return;
            }
            const actionFlush = target.getAttribute("data-w-wishlist-action-flush");
            if (!actionFlush) {
                event.preventDefault();
            }
            if (!action || !this.supportedActions.includes(action)) {
                return;
            }
            const actionFunc = this[action];
            if (actionFunc instanceof Function) {
                return actionFunc({
                    args: actionArgs,
                    event,
                });
            }
        };
        handleOfferChange = (func) => {
            const self = this;
            return function () {
                let beforeId = this.productType === 3
                    ? this.offerNum > -1
                        ? this.offers[this.offerNum].ID
                        : 0
                    : this.product.id;
                let afterId = -1;
                let index = -1;
                let boolOneSearch = true;
                for (let i = 0; i < this.offers.length; i++) {
                    boolOneSearch = true;
                    for (let j in this.selectedValues) {
                        if (this.selectedValues[j] !== this.offers[i].TREE[j]) {
                            boolOneSearch = false;
                            break;
                        }
                    }
                    if (boolOneSearch) {
                        index = i;
                        break;
                    }
                }
                if (index > -1) {
                    afterId = this.offers[index].ID;
                }
                else {
                    afterId = this.product.id;
                }
                if (beforeId && afterId && beforeId !== afterId) {
                    document
                        .querySelectorAll(`[data-w-wishlist-action-args="${beforeId}"][data-w-wishlist-action][data-w-wishlist-control]`)
                        .forEach((element) => {
                        const actionArgs = element.getAttribute("data-w-wishlist-action-args");
                        if (!actionArgs) {
                            return;
                        }
                        element.setAttribute("data-w-wishlist-action-args", afterId.toString());
                        const labels = element.querySelectorAll("[data-w-wishlist-control-label]");
                        if (self.items.has(afterId.toString())) {
                            element.setAttribute("data-w-wishlist-control-active", "");
                            labels.forEach((label) => {
                                label.textContent = "В избранном";
                            });
                        }
                        else {
                            element.removeAttribute("data-w-wishlist-control-active");
                            labels.forEach((label) => {
                                label.textContent = "В избранное";
                            });
                        }
                    });
                }
                func.call(this);
            };
        };
        setSessid = (sessid) => {
            this.sessid = sessid;
        };
        setItems = (items) => {
            this.items = new Set(items.map((item) => item.toString()));
        };
        addItem = (item) => {
            this.items.add(item.toString());
        };
        removeItem = (item) => {
            this.items.delete(item.toString());
        };
        isStringHTML = (string) => {
            const doc = new DOMParser().parseFromString(string, "text/html");
            return [...doc.body.childNodes].some((node) => node.nodeType === 1);
        };
        renderString = ({ string, container, config, }) => {
            const replace = config.replace;
            const templateElement = document.createElement("template");
            templateElement.innerHTML = string;
            const fragment = templateElement.content;
            fragment.querySelectorAll("script").forEach((scriptTag) => {
                const scriptParentNode = scriptTag.parentNode;
                scriptParentNode?.removeChild(scriptTag);
                const script = document.createElement("script");
                script.text = scriptTag.text;
                // Новое поведение для скриптов
                if (scriptTag.id) {
                    script.id = scriptTag.id;
                }
                scriptParentNode?.append(script);
            });
            if (replace) {
                // омг, фикс для старых браузеров сафари, кринге
                if (!container.replaceChildren) {
                    container.innerHTML = "";
                    container.appendChild(fragment);
                    return;
                }
                return container.replaceChildren(fragment);
            }
            return container.appendChild(fragment);
        };
        toggle = async ({ args, event }) => {
            // if (this.isLoading) {
            //   return;
            // }
            if (!args) {
                return;
            }
            const controls = document.querySelectorAll(`[data-w-wishlist-action-args="${args}"][data-w-wishlist-action][data-w-wishlist-control]`);
            if (!controls) {
                return;
            }
            // this.isLoading = true;
            controls.forEach((control) => {
                control.setAttribute("disabled", "");
            });
            const data = new FormData();
            data.set("sessid", this.sessid);
            data.set("product_id", args);
            let responseData = {};
            try {
                const response = await fetch("/bitrix/services/main/ajax.php?action=welpodron%3Awishlist.Receiver.toggle", {
                    method: "POST",
                    body: data,
                });
                if (!response.ok) {
                    throw new Error(response.statusText);
                }
                const bitrixResponse = await response.json();
                if (bitrixResponse.status === "error") {
                    console.error(bitrixResponse);
                    const error = bitrixResponse.errors[0];
                    if (this.isStringHTML(error.message)) {
                        this.renderString({
                            string: error.message,
                            container: (event?.target)
                                .parentElement,
                            config: {
                                replace: true,
                            },
                        });
                    }
                }
                else {
                    responseData = bitrixResponse.data;
                    if (responseData.HTML != null) {
                        if (this.isStringHTML(responseData.HTML)) {
                            this.renderString({
                                string: responseData.HTML,
                                container: (event?.target)
                                    .parentElement,
                                config: {
                                    replace: true,
                                },
                            });
                        }
                    }
                    if (responseData.IN_WISHLIST != null) {
                        if (responseData.PRODUCT_ID) {
                            if (responseData.IN_WISHLIST) {
                                this.addItem(responseData.PRODUCT_ID);
                            }
                            else {
                                this.removeItem(responseData.PRODUCT_ID);
                            }
                        }
                        controls.forEach((control) => {
                            if (responseData.IN_WISHLIST) {
                                control.setAttribute("data-w-wishlist-control-active", "");
                            }
                            else {
                                control.removeAttribute("data-w-wishlist-control-active");
                            }
                            const labels = control.querySelectorAll("[data-w-wishlist-control-label]");
                            labels.forEach((label) => {
                                label.textContent = responseData.IN_WISHLIST
                                    ? "В избранном"
                                    : "В избранное";
                            });
                        });
                    }
                    if (responseData.WISHLIST_COUNTER != null) {
                        const links = document.querySelectorAll("[data-w-wishlist-link]");
                        links.forEach((link) => {
                            if (responseData.WISHLIST_COUNTER) {
                                link.setAttribute("data-w-wishlist-link-active", "");
                            }
                            else {
                                link.removeAttribute("data-w-wishlist-link-active");
                            }
                            const counters = link.querySelectorAll("[data-w-wishlist-link-counter]");
                            counters.forEach((counter) => {
                                counter.textContent = responseData.WISHLIST_COUNTER;
                            });
                        });
                    }
                }
            }
            catch (error) {
                console.error(error);
            }
            finally {
                const event = new CustomEvent("welpodron.wishlist:toggle:after", {
                    bubbles: true,
                    cancelable: false,
                    detail: responseData,
                });
                document.dispatchEvent(event);
                // this.isLoading = false;
                controls.forEach((control) => {
                    control.removeAttribute("disabled");
                });
            }
        };
    }
    window.welpodron.wishlist = Wishlist;
})();
