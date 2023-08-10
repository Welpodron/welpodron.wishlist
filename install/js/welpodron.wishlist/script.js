"use strict";
((window) => {
    if (window.welpodron && window.welpodron.templater) {
        if (window.welpodron.wishlist) {
            return;
        }
        const MODULE_BASE = "wishlist";
        const EVENT_TOGGLE_BEFORE = `welpodron.${MODULE_BASE}:toggle:before`;
        const EVENT_TOGGLE_AFTER = `welpodron.${MODULE_BASE}:toggle:after`;
        const ATTRIBUTE_BASE = `data-w-${MODULE_BASE}`;
        const ATTRIBUTE_RESPONSE = `${ATTRIBUTE_BASE}-response`;
        const ATTRIBUTE_CONTROL = `${ATTRIBUTE_BASE}-control`;
        const ATTRIBUTE_CONTROL_ACTIVE = `${ATTRIBUTE_CONTROL}-active`;
        const ATTRIBUTE_CONTROL_LABEL = `${ATTRIBUTE_CONTROL}-label`;
        const ATTRIBUTE_LINK = `${ATTRIBUTE_BASE}-link`;
        const ATTRIBUTE_LINK_COUNTER = `${ATTRIBUTE_LINK}-counter`;
        const ATTRIBUTE_LINK_ACTIVE = `${ATTRIBUTE_LINK}-active`;
        const ATTRIBUTE_ACTION = `${ATTRIBUTE_BASE}-action`;
        const ATTRIBUTE_ACTION_ARGS = `${ATTRIBUTE_ACTION}-args`;
        const ATTRIBUTE_ACTION_FLUSH = `${ATTRIBUTE_ACTION}-flush`;
        class Wishlist {
            sessid = "";
            items = new Set();
            supportedActions = ["toggle"];
            constructor({ sessid, items, config = {} }) {
                if (Wishlist.instance) {
                    Wishlist.instance.sessid = sessid;
                    return Wishlist.instance;
                }
                this.setSessid(sessid);
                this.setItems(items);
                if (document.readyState === "loading") {
                    document.addEventListener("DOMContentLoaded", this.handleDocumentLoaded, {
                        once: true,
                    });
                }
                else {
                    this.handleDocumentLoaded();
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
                    .querySelectorAll(`[${ATTRIBUTE_CONTROL}][${ATTRIBUTE_ACTION}][${ATTRIBUTE_ACTION_ARGS}]`)
                    .forEach((element) => {
                    const actionArgs = element.getAttribute(ATTRIBUTE_ACTION_ARGS);
                    if (!actionArgs) {
                        return;
                    }
                    const labels = element.querySelectorAll(`[${ATTRIBUTE_CONTROL_LABEL}]`);
                    if (this.items.has(actionArgs)) {
                        element.setAttribute(ATTRIBUTE_CONTROL_ACTIVE, "");
                        labels.forEach((label) => {
                            label.textContent = "В избранном";
                        });
                    }
                    else {
                        element.removeAttribute(ATTRIBUTE_CONTROL_ACTIVE);
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
                target = target.closest(`[${ATTRIBUTE_CONTROL}][${ATTRIBUTE_ACTION}]`);
                if (!target) {
                    return;
                }
                const action = target.getAttribute(ATTRIBUTE_ACTION);
                const actionArgs = target.getAttribute(ATTRIBUTE_ACTION_ARGS);
                if (!actionArgs) {
                    return;
                }
                const actionFlush = target.getAttribute(ATTRIBUTE_ACTION_FLUSH);
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
                            .querySelectorAll(`[${ATTRIBUTE_CONTROL}][${ATTRIBUTE_ACTION}][${ATTRIBUTE_ACTION_ARGS}="${beforeId}"]`)
                            .forEach((element) => {
                            const actionArgs = element.getAttribute(ATTRIBUTE_ACTION_ARGS);
                            if (!actionArgs) {
                                return;
                            }
                            element.setAttribute(ATTRIBUTE_ACTION_ARGS, afterId.toString());
                            const labels = element.querySelectorAll(`[${ATTRIBUTE_CONTROL_LABEL}]`);
                            if (self.items.has(afterId.toString())) {
                                element.setAttribute(ATTRIBUTE_CONTROL_ACTIVE, "");
                                labels.forEach((label) => {
                                    label.textContent = "В избранном";
                                });
                            }
                            else {
                                element.removeAttribute(ATTRIBUTE_CONTROL_ACTIVE);
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
            toggle = async ({ args, event }) => {
                if (!args) {
                    return;
                }
                const controls = document.querySelectorAll(`[${ATTRIBUTE_CONTROL}][${ATTRIBUTE_ACTION}][${ATTRIBUTE_ACTION_ARGS}="${args}"]`);
                controls.forEach((control) => {
                    control.setAttribute("disabled", "");
                });
                const data = new FormData();
                // composite and deep cache fix
                if (window.BX && window.BX.bitrix_sessid) {
                    this.setSessid(window.BX.bitrix_sessid());
                }
                data.set("sessid", this.sessid);
                data.set("args", args);
                let dispatchedEvent = new CustomEvent(EVENT_TOGGLE_BEFORE, {
                    bubbles: true,
                    cancelable: false,
                });
                document.dispatchEvent(dispatchedEvent);
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
                        if (!event || !event?.target) {
                            return;
                        }
                        const target = event.target.closest(`[${ATTRIBUTE_CONTROL}][${ATTRIBUTE_ACTION}]`);
                        if (!target || !target.parentElement) {
                            return;
                        }
                        let div = target.parentElement.querySelector(`[${ATTRIBUTE_RESPONSE}]`);
                        if (!div) {
                            div = document.createElement("div");
                            div.setAttribute(ATTRIBUTE_RESPONSE, "");
                            target.parentElement.appendChild(div);
                        }
                        window.welpodron.templater.renderHTML({
                            string: error.message,
                            container: div,
                            config: {
                                replace: true,
                            },
                        });
                    }
                    else {
                        responseData = bitrixResponse.data;
                        if (responseData.HTML != null) {
                            if (event && event?.target) {
                                const target = event.target.closest(`[${ATTRIBUTE_CONTROL}][${ATTRIBUTE_ACTION}]`);
                                if (target && target.parentElement) {
                                    let div = target.parentElement.querySelector(`[${ATTRIBUTE_RESPONSE}]`);
                                    if (!div) {
                                        div = document.createElement("div");
                                        div.setAttribute(ATTRIBUTE_RESPONSE, "");
                                        target.parentElement.appendChild(div);
                                    }
                                    window.welpodron.templater.renderHTML({
                                        string: responseData.HTML,
                                        container: div,
                                        config: {
                                            replace: true,
                                        },
                                    });
                                }
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
                                    control.setAttribute(ATTRIBUTE_CONTROL_ACTIVE, "");
                                }
                                else {
                                    control.removeAttribute(ATTRIBUTE_CONTROL_ACTIVE);
                                }
                                const labels = control.querySelectorAll(`[${ATTRIBUTE_CONTROL_LABEL}]`);
                                labels.forEach((label) => {
                                    label.textContent = responseData.IN_WISHLIST
                                        ? "В избранном"
                                        : "В избранное";
                                });
                            });
                        }
                        if (responseData.WISHLIST_COUNTER != null) {
                            const links = document.querySelectorAll(`[${ATTRIBUTE_LINK}]`);
                            links.forEach((link) => {
                                if (responseData.WISHLIST_COUNTER) {
                                    link.setAttribute(ATTRIBUTE_LINK_ACTIVE, "");
                                }
                                else {
                                    link.removeAttribute(ATTRIBUTE_LINK_ACTIVE);
                                }
                                const counters = link.querySelectorAll(`[${ATTRIBUTE_LINK_COUNTER}]`);
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
                    dispatchedEvent = new CustomEvent(EVENT_TOGGLE_AFTER, {
                        bubbles: true,
                        cancelable: false,
                        detail: responseData,
                    });
                    document.dispatchEvent(dispatchedEvent);
                    controls.forEach((control) => {
                        control.removeAttribute("disabled");
                    });
                }
            };
        }
        window.welpodron.wishlist = Wishlist;
    }
})(window);
