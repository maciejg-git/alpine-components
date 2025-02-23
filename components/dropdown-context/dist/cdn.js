(() => {
  // components/dropdown-context/dropdown-context.js
  function dropdown_context_default(Alpine2) {
    Alpine2.data("dropdownContext", (dataExtend = {}) => {
      let aria = {
        menu: {
          ":role"() {
            return this.role;
          },
          tabindex: 0
        },
        menuItem: {
          role: "menuitem",
          tabindex: -1
        }
      };
      let ariaRoles = ["menu", "listbox", "dialog"];
      let floatingUIoptions = [
        "placement",
        "offsetX",
        "offsetY",
        "flip",
        "autoPlacement",
        "inline"
      ];
      let bind = {};
      ["menu"].forEach((i) => {
        if (dataExtend[i]) {
          bind[i] = dataExtend[i];
          delete dataExtend[i];
        }
      });
      return {
        isShow: false,
        floating: null,
        contextData: {},
        autoClose: true,
        placement: "bottom-start",
        offsetX: 0,
        offsetY: 0,
        flip: false,
        autoPlacement: false,
        role: "",
        menuItems: null,
        focusedMenuItemIndex: -1,
        init() {
          this.$nextTick(() => {
            this.autoClose = JSON.parse(
              Alpine2.bound(this.$el, "data-auto-close") ?? this.autoClose
            );
            this.placement = Alpine2.bound(this.$el, "data-placement") ?? this.placement;
            this.offsetX = parseInt(
              Alpine2.bound(this.$el, "data-offset-x") ?? this.offsetX
            );
            this.offsetY = parseInt(
              Alpine2.bound(this.$el, "data-offset-y") ?? this.offsetY
            );
            this.flip = JSON.parse(
              Alpine2.bound(this.$el, "data-flip") ?? this.flip
            );
            this.autoPlacement = JSON.parse(
              Alpine2.bound(this.$el, "data-auto-placement") ?? this.autoPlacement
            );
            let role = Alpine2.bound(this.$el, "data-role");
            this.role = ariaRoles.includes(role) ? role : null;
            let options = floatingUIoptions.reduce((acc, v) => {
              return { ...acc, [v]: this[v] };
            });
            this.floating = useFloating(null, this.$refs.menu, options);
          });
          Alpine2.bind(this.$el, {
            ["@keydown.escape.window.prevent"]() {
              this.close();
            },
            ["@keydown.down.prevent"]() {
              if (!this.menuItems.length) {
                return;
              }
              this.$nextTick(() => {
                if (this.focusedMenuItemIndex < this.menuItems.length - 1) {
                  this.focusedMenuItemIndex++;
                }
                let el = this.menuItems[this.focusedMenuItemIndex];
                el.focus();
              });
            },
            ["@keydown.up.prevent"]() {
              if (!this.menuItems.length) {
                return;
              }
              if (this.focusedMenuItemIndex === -1) {
                this.focusedMenuItemIndex = this.menuItems.length;
              }
              this.$nextTick(() => {
                if (this.focusedMenuItemIndex > 0) {
                  this.focusedMenuItemIndex--;
                }
                let el = this.menuItems[this.focusedMenuItemIndex];
                el.focus();
              });
            }
          });
        },
        open() {
          this.floating.startAutoUpdate();
          this.isShow = true;
          this.menuItems = this.$refs.menu.querySelectorAll("[role='menuitem']");
          this.$nextTick(() => this.$refs.menu.focus());
        },
        close() {
          this.floating.destroy();
          this.isShow = false;
          this.focusedMenuItemIndex = -1;
        },
        menu: {
          "x-show"() {
            return this.isShow;
          },
          "@open-contextmenu.window"() {
            if (this.$event.detail.id !== this.$root.id) {
              return;
            }
            let mouseEvent = this.$event.detail.$event;
            this.floating.updateVirtualElement(mouseEvent);
            this.contextData = this.$event.detail.data;
            this.open();
          },
          "x-ref": "menu",
          "@click.outside"() {
            this.close();
          },
          "@click"() {
            if (this.autoClose && this.$el.contains(this.$event.target)) {
              this.close();
            }
          },
          ...bind.menu,
          ...aria.menu
        },
        menuItem: {
          ...aria.menuItem
        },
        ...dataExtend
      };
    });
  }

  // components/dropdown-context/builds/cdn.js
  document.addEventListener("alpine:init", () => {
    Alpine.plugin(dropdown_context_default);
  });
})();
