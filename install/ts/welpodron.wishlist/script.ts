(() => {
  if (!(window as any).welpodron) {
    (window as any).welpodron = {};
  }

  if ((window as any).welpodron.wishlist) {
    return;
  }

  type _BitrixResponse = {
    data: any;
    status: "success" | "error";
    errors: {
      code: string;
      message: string;
      customData: string;
    }[];
  };

  type WishlistConfigType = {};

  type WishlistPropsType = {
    sessid: string;
    items: string[];
    config?: WishlistConfigType;
  };

  class Wishlist {
    sessid = "";

    items = new Set<string>();

    supportedActions = ["toggle"];
    // isLoading = false;

    constructor({ sessid, items, config = {} }: WishlistPropsType) {
      if ((Wishlist as any).instance) {
        return (Wishlist as any).instance;
      }

      this.setSessid(sessid);
      this.setItems(items);

      if (
        document.readyState === "complete" ||
        document.readyState === "interactive"
      ) {
        this.handleDocumentLoaded();
      } else {
        document.addEventListener(
          "DOMContentLoaded",
          this.handleDocumentLoaded,
          {
            once: true,
          }
        );
      }

      document.removeEventListener("click", this.handleDocumentClick);
      document.addEventListener("click", this.handleDocumentClick);

      if ((window as any).JCCatalogItem) {
        (window as any).JCCatalogItem.prototype.changeInfo =
          this.handleOfferChange(
            (window as any).JCCatalogItem.prototype.changeInfo
          );
      }

      if ((window as any).JCCatalogElement) {
        (window as any).JCCatalogElement.prototype.changeInfo =
          this.handleOfferChange(
            (window as any).JCCatalogElement.prototype.changeInfo
          );
      }

      (Wishlist as any).instance = this;
    }

    handleDocumentLoaded = () => {
      document
        .querySelectorAll(
          "[data-w-wishlist-action-args][data-w-wishlist-action][data-w-wishlist-control]"
        )
        .forEach((element) => {
          const actionArgs = (element as Element).getAttribute(
            "data-w-wishlist-action-args"
          );

          if (!actionArgs) {
            return;
          }

          const labels = element.querySelectorAll(
            "[data-w-wishlist-control-label]"
          );

          if (this.items.has(actionArgs)) {
            element.setAttribute("data-w-wishlist-control-active", "");

            labels.forEach((label) => {
              label.textContent = "В избранном";
            });
          } else {
            element.removeAttribute("data-w-wishlist-control-active");

            labels.forEach((label) => {
              label.textContent = "В избранное";
            });
          }
        });
    };

    handleDocumentClick = (event: MouseEvent) => {
      let { target } = event;

      if (!target) {
        return;
      }

      target = (target as Element).closest(
        `[data-w-wishlist-action-args][data-w-wishlist-action][data-w-wishlist-control]`
      );

      if (!target) {
        return;
      }

      const action = (target as Element).getAttribute(
        "data-w-wishlist-action"
      ) as keyof this;

      const actionArgs = (target as Element).getAttribute(
        "data-w-wishlist-action-args"
      );

      if (!actionArgs) {
        return;
      }

      const actionFlush = (target as Element).getAttribute(
        "data-w-wishlist-action-flush"
      );

      if (!actionFlush) {
        event.preventDefault();
      }

      if (!action || !this.supportedActions.includes(action as string)) {
        return;
      }

      const actionFunc = this[action] as any;

      if (actionFunc instanceof Function) {
        return actionFunc({
          args: actionArgs,
          event,
        });
      }
    };

    handleOfferChange = (func: Function) => {
      const self = this;

      return function () {
        let beforeId =
          this.productType === 3
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
        } else {
          afterId = this.product.id;
        }

        if (beforeId && afterId && beforeId !== afterId) {
          document
            .querySelectorAll(
              `[data-w-wishlist-action-args="${beforeId}"][data-w-wishlist-action][data-w-wishlist-control]`
            )
            .forEach((element) => {
              const actionArgs = (element as Element).getAttribute(
                "data-w-wishlist-action-args"
              );

              if (!actionArgs) {
                return;
              }

              element.setAttribute(
                "data-w-wishlist-action-args",
                afterId.toString()
              );

              const labels = element.querySelectorAll(
                "[data-w-wishlist-control-label]"
              );

              if (self.items.has(afterId.toString())) {
                element.setAttribute("data-w-wishlist-control-active", "");

                labels.forEach((label) => {
                  label.textContent = "В избранном";
                });
              } else {
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

    setSessid = (sessid: string) => {
      this.sessid = sessid;
    };

    setItems = (items: string[]) => {
      this.items = new Set(items.map((item) => item.toString()));
    };

    addItem = (item: string) => {
      this.items.add(item.toString());
    };

    removeItem = (item: string) => {
      this.items.delete(item.toString());
    };

    toggle = async ({ args, event }: { args?: unknown; event?: Event }) => {
      // if (this.isLoading) {
      //   return;
      // }

      if (!args) {
        return;
      }

      const controls = document.querySelectorAll(
        `[data-w-wishlist-action-args="${args}"][data-w-wishlist-action][data-w-wishlist-control]`
      );

      if (!controls) {
        return;
      }

      // this.isLoading = true;

      controls.forEach((control) => {
        control.setAttribute("disabled", "");
      });

      const data = new FormData();

      data.set("sessid", this.sessid);
      data.set("product_id", args as any);

      let responseData: any = {};

      try {
        const response = await fetch(
          "/bitrix/services/main/ajax.php?action=welpodron%3Awishlist.Receiver.toggle",
          {
            method: "POST",
            body: data,
          }
        );

        if (!response.ok) {
          throw new Error(response.statusText);
        }

        const bitrixResponse: _BitrixResponse = await response.json();

        if (bitrixResponse.status === "error") {
          console.error(bitrixResponse);
        } else {
          responseData = bitrixResponse.data;

          // if (responseData.HTML != null) {
          //   if (this.isStringHTML(responseData.HTML)) {
          //     this.renderString({
          //       string: responseData.HTML,
          //       container: (event?.target as HTMLElement)
          //         .parentElement as HTMLElement,
          //       config: {
          //         replace: true,
          //       },
          //     });
          //   }
          // }

          if (responseData.IN_WISHLIST != null) {
            if (responseData.PRODUCT_ID) {
              if (responseData.IN_WISHLIST) {
                this.addItem(responseData.PRODUCT_ID);
              } else {
                this.removeItem(responseData.PRODUCT_ID);
              }
            }

            controls.forEach((control) => {
              if (responseData.IN_WISHLIST) {
                control.setAttribute("data-w-wishlist-control-active", "");
              } else {
                control.removeAttribute("data-w-wishlist-control-active");
              }

              const labels = control.querySelectorAll(
                "[data-w-wishlist-control-label]"
              );

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
              } else {
                link.removeAttribute("data-w-wishlist-link-active");
              }

              const counters = link.querySelectorAll(
                "[data-w-wishlist-link-counter]"
              );

              counters.forEach((counter) => {
                counter.textContent = responseData.WISHLIST_COUNTER;
              });
            });
          }
        }
      } catch (error) {
        console.error(error);
      } finally {
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

  (window as any).welpodron.wishlist = Wishlist;
})();
