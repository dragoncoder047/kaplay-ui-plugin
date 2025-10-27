import kaplay, { AreaComp, Color, ColorComp, Comp, FixedComp, FormattedText, GameObj, KEventController, MouseButton, PosComp, TextComp, Vec2 } from "kaplay";
import uiPlugin, { LayoutType, UIOrientation, UiElementComp } from "../src/plugin";

const k = kaplay({
    plugins: [uiPlugin],
});

k.loadBean();

k.onLoad(() => {
    // region window
    type WindowCompOpt = {
        position?: Vec2,
        size?: Vec2,
    }

    interface WindowComp extends Comp {
        titlebar: GameObj;
        panel: GameObj;
        title: string;
    }

    function escape(text: string): string {
        return text.replaceAll(/(?<!\\)[\[\\]/g, "\\$1");
    }

    function newWindow(title: string, opt: WindowCompOpt): GameObj<PosComp | AreaComp | WindowComp> {
        const position = opt.position || k.vec2();
        const size = opt.size || k.vec2();

        const window = k.add([
            k.pos(position),
            k.rect(size.x + 4, 2 + 25 + 2 + size.y + 2),
            k.area()
        ]) as any;

        const titlebar = window.add([
            k.pos(2, 2),
            k.rect(size.x + 4, 25),
            k.area(),
            k.color(80, 80, 255),
            k.ui({ type: "dragitem", proxy: window, bringToFront: true })
        ]);

        const label = titlebar.add([
            k.pos(4, 14),
            k.text(title, {
                size: 20
            }),
            k.anchor("left")
        ])

        const panel = window.add([
            k.pos(2, 2 + 25 + 2),
            k.rect(size.x, size.y),
            k.color(k.WHITE),
            k.opacity(1.0),
            k.layout({ type: "column", padding: 5, spacing: 5, columns: 2, maxWidth: 170 })
        ]);

        window.use({
            id: "window",
            get titlebar() { return titlebar },
            get panel() { return panel },
            get title() { return label.text; },
            set title(value) { label.text = value; }
        });

        return window;
    }

    const window = newWindow("Settings", { position: k.vec2(100, 50) });

    function resizeWindow(window: GameObj, size: Vec2) {
        [window.panel.width, window.panel.height] = [size.x, size.y];
        // x = padding + panel.width + padding
        // y + padding + titlebar.height + spacing + panel.height + padding
        [window.width, window.height] = [size.x + 4, 2 + 25 + 2 + size.y + 2];
        window.titlebar.width = size.x
    }

    // region button
    /**
     * Create a button
     * @param parent Parent to attach the button to
     * @param opt Options 
     * @returns The newly attached button
     */
    function newButton(parent: GameObj, { position = k.vec2(), label = "", layout = { padding: [3, 2] } } = {}) {
        const dimensions = k.formatText({ text: label, size: 20 })
        let width = dimensions.width + 16 + layout.padding[0] * 2
        let height = dimensions.height + layout.padding[1] * 2
        const button = parent.add([
            k.rect(width, height),
            k.pos(position),
            k.area(),
            k.color(k.WHITE),
            k.outline(1, k.WHITE),
            k.ui({ type: "button" })
        ])
        // Label
        button.add([
            k.text(label, {
                size: 20
            }),
            k.pos(width / 2, (dimensions.height + layout.padding[1] * 2) / 2 + 1),
            k.anchor("center"),
            k.color(k.BLACK)
        ])
        // Resize button and bg
        button.width = width
        button.height = height

        button.onPressed(() => { button.color = k.rgb(150, 150, 150) })
        button.onReleased(() => { button.color = k.rgb(220, 220, 220) })
        button.onFocus(() => { button.outline.color = k.BLACK; })
        button.onBlur(() => { button.outline.color = k.WHITE; })
        button.trigger("released");
        button.trigger("blur");

        return button
    }

    const button = newButton(window.panel, { position: k.vec2(80, 20), label: "Action" })
    button.onAction(() => { k.shake(); })

    // region checkbox
    /**
     * Create a checkbox
     * @param parent Parent to attach the button to
     * @param opt Options 
     * @returns The newly attached checkbox
     */
    function newCheckBox(parent: GameObj, { position = k.vec2(), label = "" } = {}) {
        const dimensions = k.formatText({ text: label, size: 20 })
        let width = dimensions.width + 16 + 6
        let height = dimensions.height + 4
        const checkbox = parent.add([
            k.rect(width, height),
            k.pos(position),
            k.area(),
            k.color(k.WHITE),
            k.outline(1, k.WHITE),
            k.ui({ type: "checkbox" })
        ])
        // Dot
        checkbox.add([
            k.rect(16, 16),
            k.outline(2, k.BLUE),
            k.pos(0, 12),
            k.anchor("left"),
            {
                draw() {
                    if (checkbox.isChecked()) {
                        k.drawLines({
                            pts: [k.vec2(4, 0), k.vec2(8, 4), k.vec2(12, -4)],
                            width: 2,
                            color: k.BLACK,
                            join: "round",
                            cap: "round"
                        })
                    }
                }
            }
        ]);
        checkbox.add([
            k.text(label, { size: 20 }),
            k.pos(20, 12),
            k.anchor("left"),
            k.color(k.BLACK)
        ]);
        // Resize button and bg
        checkbox.width = width;
        checkbox.height = height;

        checkbox.onPressed(() => { checkbox.color = k.rgb(150, 150, 150) });
        checkbox.onReleased(() => { checkbox.color = k.rgb(220, 220, 220) });
        checkbox.onFocus(() => { checkbox.outline.color = k.BLACK; });
        checkbox.onBlur(() => { checkbox.outline.color = k.WHITE; });
        checkbox.trigger("released");
        checkbox.trigger("blur");

        return checkbox;
    }

    const checkbox = newCheckBox(window.panel, { position: k.vec2(80, 80), label: "Visible" })
    checkbox.onChecked(checked => { window.panel.opacity = checked ? 1.0 : 0.0; })
    checkbox.setChecked(true)

    // region radio
    /**
     * Create a radiobutton
     * @param parent Parent to attach the button to
     * @param opt Options 
     * @returns The newly attached radio button
     */
    function newRadio(parent: GameObj, { position = k.vec2(), label = "", group = "" } = {}) {
        const dimensions = k.formatText({ text: label, size: 20 })
        const radio = parent.add([
            k.rect(dimensions.width + 16 + 6, 20 + 4),
            k.pos(position),
            k.area(),
            k.color(k.WHITE),
            k.outline(1, k.WHITE),
            k.ui({ type: "radio", group: group })
        ])
        radio.add([
            k.circle(8),
            k.outline(2, k.BLUE),
            k.pos(8, 12),
            {
                draw(this: GameObj<UiElementComp>) {
                    if (radio.isChecked()) {
                        k.drawCircle({
                            pos: k.Vec2.ZERO,
                            radius: 4,
                            color: k.BLUE
                        })
                    }
                }
            }
        ]);
        radio.add([
            k.text(label, {
                size: 20
            }),
            k.pos(20, 12),
            k.anchor("left"),
            k.color(k.BLACK)
        ])

        radio.onFocus(() => { radio.outline.color = k.BLACK; })
        radio.onBlur(() => { radio.outline.color = k.WHITE; })

        return radio
    }

    const radio1 = newRadio(window.panel, { position: k.vec2(80, 120), label: "Row", group: "radiogroup" })
    const radio2 = newRadio(window.panel, { position: k.vec2(80, 160), label: "Column", group: "radiogroup" })
    const radio3 = newRadio(window.panel, { position: k.vec2(80, 200), label: "Grid", group: "radiogroup" })
    const radio4 = newRadio(window.panel, { position: k.vec2(80, 240), label: "Flex", group: "radiogroup" })

    radio1.onChecked(checked => { if (checked) { window.panel.type = "row"; resizeWindow(window, window.panel.doLayout()); } })
    radio2.onChecked(checked => { if (checked) { window.panel.type = "column"; resizeWindow(window, window.panel.doLayout()); } })
    radio2.setChecked(true)
    radio3.onChecked(checked => { if (checked) { window.panel.type = "grid"; resizeWindow(window, window.panel.doLayout()); } })
    radio4.onChecked(checked => { if (checked) { window.panel.type = "flex"; resizeWindow(window, window.panel.doLayout()); } })

    // region slider
    type SliderCompOpt = {
        position?: Vec2,
        size?: Vec2,
        label?: string,
        orientation?: UIOrientation
    };

    interface SliderComp extends UiElementComp {
        thumb: GameObj;
        gutter: GameObj;
    };

    /**
     * Create a slider
     * @param parent Parent to attach the slider to
     * @param opt Options 
     * @returns The newly attached slider
     */
    function newSlider(parent: GameObj, opt: SliderCompOpt): GameObj<PosComp | SliderComp> {
        const position = opt.position || k.vec2();
        const size = opt.size || k.vec2();
        const label = opt.label || "";
        const orientation = opt.orientation || "horizontal";

        if (orientation === "horizontal") {
            size.x = Math.max(100, size.x);
            size.y = Math.max(20, size.y)
        }
        else {
            size.x = Math.max(20, size.x);
            size.y = Math.max(100, size.y)
        }

        const dimensions = k.formatText({ text: label, size: 20 })
        const slider = parent.add([
            k.rect(size.x, size.y + dimensions.height),
            k.pos(position),
            k.area(),
            k.color(k.WHITE),
            k.outline(1, k.WHITE)
        ])
        let y = 0
        if (label && label != "") {
            slider.add([
                k.text(label, {
                    size: 20
                }),
                k.pos(0, 10),
                k.anchor("left"),
                k.color(k.BLACK)
            ])
            y += dimensions.height;
        }
        const gutter = slider.add([
            orientation === "horizontal" ?
                k.rect(slider.width - 8, 4) :
                k.rect(4, slider.height - 8),
            orientation === "horizontal" ?
                k.pos(4, y + 8) : k.pos(8, y + 4),
            k.outline(1, k.BLACK),
        ]);
        const thumb = slider.add([
            orientation === "horizontal" ?
                k.rect(10, slider.height - 4) :
                k.rect(slider.width - 4, 10),
            k.pos(2, y + 2),
            k.area(),
            k.outline(1, k.BLACK),
            k.ui({ type: "sliderthumb", orientation })
        ])
        // Proxy so we can use slider directly
        slider.use({
            id: "slider",
            get thumb() { return thumb },
            get gutter() { return gutter },
            get value() {
                return thumb.value;
            },
            set value(value) {
                thumb.value = value;
            },
            onValueChanged(cb: (value: number) => void) {
                thumb.onValueChanged(cb);
            }
        } as any);

        thumb.onFocus(() => { slider.outline.color = k.BLACK; })
        thumb.onBlur(() => { slider.outline.color = k.WHITE; })

        return slider as any;
    }

    const slider = newSlider(window.panel, { position: k.vec2(80, 260), label: "Red" })
    slider.value = 1;

    slider.onValueChanged(value => {
        k.debug.log(`Slider set to ${value}`)
        window.panel.color = k.rgb(value * 255, 255, 255)
    })

    // region group box

    interface GroupBoxComp {
        content: GameObj<PosComp>;
        onCollapseChanged(action: (collapsed: boolean) => void): KEventController;
    };

    /**
     * Create a group box
     * @param parent Parent to attach the group box to
     * @param opt Options 
     * @returns The newly attached group box
     */
    function newGroupBox(parent: GameObj, { position = k.vec2(), label = "", layout = "column" } = {}): GameObj<PosComp | GroupBoxComp> {
        const dimensions = k.formatText({ text: "► " + label, size: 20 })
        let collapsed = false;
        const box = parent.add([
            k.rect(dimensions.width, dimensions.height),
            k.pos(position),
            k.area(),
            k.color(k.WHITE),
            k.outline(1, k.WHITE),
        ]);
        const collapse = box.add([
            k.text((collapsed ? "► " : "▼ ") + label, {
                size: 20
            }),
            k.pos(0, 10),
            k.anchor("left"),
            k.color(k.BLACK),
            k.area(),
            k.ui({ type: "checkbox" })
        ]);
        const content = box.add([
            k.pos(0, 20),
            k.rect(1, 1),
            k.area(),
            k.layout({ type: layout as LayoutType }) // TODO: pass from options
        ]);
        collapse.onChecked((checked) => {
            collapsed = checked;
            collapse.text = (collapsed ? "► " : "▼ ") + label;
            if (collapsed) {
                content.hidden = true;
                box.width = Math.max(dimensions.width, content.width);
                box.height = dimensions.height;
            }
            else {
                content.hidden = false;
                const size = content.doLayout();
                [content.width, content.height] = [size.x, size.y]
                box.width = Math.max(dimensions.width, content.width);
                box.height = dimensions.height + content.height;
            }
        });
        k.onAdd(obj => {
            if (content.isAncestorOf(obj)) {
                const size = content.doLayout();
                [content.width, content.height] = [size.x, size.y]
                box.width = Math.max(dimensions.width, content.width);
                box.height = collapsed ? dimensions.height : dimensions.height + content.height;
            }
        })

        box.use({
            id: "groupBox",
            get content() {
                return content;
            },
            onCollapseChanged(cb) {
                return collapse.onChecked((checked) => {
                    cb(checked)
                });
            },
        } as GroupBoxComp & Comp)

        return box as any;
    }

    const box = newGroupBox(window.panel, { label: "Crew settings" });

    // region dropdown

    type DropdownCompOpt = {
        position?: Vec2;
        label?: string;
        options: string[];
        selected: string;
    }

    /**
     * Create a dropdown
     * @param parent Parent to attach the dropdown to
     * @param opt Options 
     * @returns The newly attached dropdown
     */
    function newDropdown(parent: GameObj, opt: DropdownCompOpt) {
        const position = opt.position || k.vec2();
        const label = opt.label || "";
        const options = opt.options || [];
        const selected = opt.selected || "";

        const dimensions = k.formatText({ text: label, size: 20 })
        const dropdown = parent.add([
            k.rect(100, 24 + dimensions.height),
            k.pos(position),
            k.area(),
            k.color(k.WHITE),
            k.outline(1, k.WHITE),
        ])
        let y = 0
        if (label && label != "") {
            dropdown.add([
                k.text(label, {
                    size: 20
                }),
                k.pos(0, 10),
                k.anchor("left"),
                k.color(k.BLACK)
            ])
            y += dimensions.height;
        }
        const button = dropdown.add([
            k.rect(dropdown.width, 24),
            k.pos(0, y + 2),
            k.area(),
            k.ui({ type: "button" })
        ])
        const selectedText = button.add([
            k.text(selected, {
                size: 20
            }),
            k.pos(4, 12),
            k.anchor("left"),
            k.color(k.BLACK)
        ])
        button.add([
            k.text("▼", {
                size: 20
            }),
            k.pos(button.width - 4, 10),
            k.anchor("right"),
            k.color(k.BLACK)
        ])

        button.onAction(() => {
            const menu = newMenu(button, { position: k.vec2(0, 24), items: options })
            menu.onValueChanged(value => { selectedText.text = value; });
        })

        return dropdown;
    }

    box.content.add([
        k.pos(0, 0),
        k.sprite("bean")
    ])
    newDropdown(box.content, { position: k.vec2(80, 280), label: "Crew", options: ["bean", "beant"], selected: "bean" });

    // region menu
    function newMenu(parent: GameObj<PosComp>, { position = k.vec2(), label = "", items = [""], hideOption = "destroy" } = {}) {
        position = parent.toWorld(position)
        const menu = k.add([
            k.pos(position),
            k.rect(200, 200),
            k.color(k.WHITE),
            k.outline(1, k.BLACK),
            k.area(),
            k.layout({ type: "column", padding: 5, spacing: 5 }),
            {
                onValueChanged(this: GameObj, cb: (value: any) => any) {
                    return this.on("valueChanged", cb)
                },
                hide(this: GameObj) {
                    switch (hideOption) {
                        case "destroy":
                            this.destroy();
                            break;
                        case "hide":
                            this.visible = false;
                            break;
                    }
                }
            }
        ]);
        for (const item of items) {
            const dimensions = k.formatText({ text: item, size: 20 })
            const menuItem = menu.add([
                k.rect(menu.width - 8, dimensions.height),
                k.pos(0, 0),
                k.area(),
                k.color(k.WHITE),
                k.ui({ type: "button" })
            ]);
            menuItem.add([
                k.text(item, {
                    size: 20
                }),
                k.pos(4, 12),
                k.anchor("left"),
                k.color(k.BLACK)
            ])
            menuItem.onHover(() => { menuItem.color = k.rgb(80, 80, 255); });
            menuItem.onHoverEnd(() => { menuItem.color = k.WHITE; });
            menuItem.onAction(() => {
                menu.trigger("valueChanged", item);
                menu.hide()
            });
        }
        const size = menu.doLayout();
        [menu.width, menu.height] = [size.x, size.y]
        menu.onMouseDown(() => {
            if (!menu.isHovering()) {
                menu.hide();
            }
        })
        return menu;
    }

    // region edit
    /**
     * Create an edit control
     * @param parent Parent to attach the edit control to
     * @param opt Options 
     * @returns The newly attached edit control
     */
    function newEdit(parent: GameObj, { position = k.vec2(), label = "", width = 0, value = "", size = 20, font = undefined } = {}) {
        let selectionStart: number = value.length;
        let selectionLength: number = 0;
        let textDimensions: FormattedText = k.formatText({ text: value, size });
        let cursor = textDimensions.width;
        const edit = parent.add([
            k.rect(width || 150, 24),
            k.pos(position),
            k.area(),
            k.color(k.WHITE),
            k.outline(1, k.WHITE),
            k.ui({ type: "custom" }),
        ]);
        const text: GameObj<TextComp | ColorComp | AreaComp | PosComp | FixedComp> = edit.add([
            k.pos(2, 12),
            k.anchor("left"),
            k.text(value, {
                size: size,
                font: font
            }),
            k.color(k.BLACK)
        ]) as any;
        function updateCursor() {
            if (selectionStart < textDimensions.chars.length) {
                cursor = textDimensions.chars[selectionStart].pos.x - textDimensions.chars[selectionStart].width * textDimensions.chars[selectionStart].scale.x / 2;
            }
            else {
                cursor = textDimensions.width;
            }
        }
        let charEvent: KEventController | null = null;
        let drawEvent: KEventController | null = null;
        let keyEvent: KEventController | null = null;
        edit.onFocus(() => {
            edit.outline.color = k.BLUE;
            if (!charEvent) {
                charEvent = k.onCharInput(ch => {
                    var str: string = text.text;
                    if (selectionStart >= str.length) {
                        str = str + ch;
                    }
                    else if (selectionStart == 0) {
                        str = ch + str.substring(selectionStart + selectionLength);
                    }
                    else {
                        str = str.substring(0, selectionStart) + ch + str.substring(selectionStart + selectionLength);
                    }
                    text.text = escape(str);
                    selectionStart += ch.length;
                    selectionLength = 0;
                    textDimensions = k.formatText({ text: str, size });
                    updateCursor();
                });
            }
            if (!drawEvent) {
                drawEvent = text.onDraw(() => {
                    k.drawLine({
                        p1: k.vec2(cursor, -size / 2),
                        p2: k.vec2(cursor, size / 2),
                        color: k.BLACK,
                    })
                });
            }
            if (!keyEvent) {
                keyEvent = text.onKeyPress(key => {
                    let str = text.text
                    switch (key) {
                        case "backspace":
                            if (selectionStart <= 0) {
                                return;
                            }
                            if (selectionLength == 0) {
                                str = str.slice(0, selectionStart - 1) + str.slice(selectionStart);
                            }
                            text.text = escape(str);
                            selectionStart -= 1;
                            selectionLength = 0;
                            updateCursor();
                            break;
                        case "left":
                            if (selectionStart > 0) {
                                selectionStart -= 1;
                                selectionLength = 0;
                                updateCursor();
                            }
                            break;
                        case "right":
                            if (selectionStart < str.length) {
                                selectionStart = Math.min(selectionStart + 1, str.length);
                                selectionLength = 0;
                                updateCursor();
                            }
                            break;
                    }
                });
            }
        });
        edit.onClick(() => {
            let pos = k.mousePos();
            pos = text.fromScreen(pos);
            if (textDimensions.chars.length > 0) {
                let index = 0;
                let x = 0;
                while (index < textDimensions.chars.length) {
                    // The character pos is already in the middle of the character
                    if (pos.x < textDimensions.chars[index].pos.x) { break; }
                    index++;
                }
                selectionStart = Math.min(index, text.text.length);
                selectionLength = 0;
                updateCursor();
            }
        });
        edit.onBlur(() => {
            edit.outline.color = k.WHITE;
            charEvent?.cancel();
            charEvent = null;
            drawEvent?.cancel();
            drawEvent = null;
        });
        return {
            get text() {
                return text.text;
            },
            set text(value) {
                text.text = value;
            },
            get color() {
                return text.color;
            },
            set color(value) {
                text.color = value;
            },
            get selection(): string {
                return "";
            },
            select(start: number, length: number = 0): string {
                selectionStart = start;
                selectionLength = length;
                return "";
            }
        }
    }

    newEdit(window.panel, { label: "Name", width: 0, value: "placeholder" });

    resizeWindow(window, window.panel.doLayout());

    box.onCollapseChanged(collapsed => {
        k.debug.log(collapsed)
        resizeWindow(window, window.panel.doLayout());
    });

    // region video window
    const window2 = newWindow("KVideo: UFO S01E01.mp4", { position: k.vec2(300, 50) });

    const videoPlane = window2.panel.add([
        k.area({ shape: new k.Rect(k.vec2(), 320 - 4, 250 - 2 - 25 - 2 - 2) }),
        k.ui({ type: "custom" }),
        //video("https://archive.org/download/ufo-s-01-e-01-identified/UFO%20S01E01%20-%20Identified.mp4", 320 - 4, 250 - 2 - 25 - 2 - 2)
        k.video("/sprites/UFO S01E01 - Identified.mp4", { width: 320 - 4, height: 250 - 2 - 25 - 2 - 2 })
    ])

    const panel3 = window2.panel.add([
        k.pos(0, 0),
        k.rect(320 - 4, 25),
        k.color(k.WHITE),
        k.opacity(1.0),
        k.layout({ type: "row", padding: 0, spacing: 5, maxWidth: 320 - 4 })
    ])

    newButton(panel3, { label: "⏸" }).onAction(() => { videoPlane.pause() });
    newButton(panel3, { label: "▶︎" }).onAction(() => { videoPlane.play() });
    const seek = newSlider(panel3, {});
    seek.onValueChanged((value) => {
        videoPlane.currentTime = value * videoPlane.duration;
    });
    seek.onUpdate(() => {
        seek.value = videoPlane.currentTime / videoPlane.duration;
    });
    const mute = newCheckBox(panel3, { label: "mute" })
    mute.onChecked((checked) => { videoPlane.mute = checked });
    mute.setChecked(true);

    panel3.doLayout();

    resizeWindow(window2, window2.panel.doLayout());

    function newListView(parent: GameObj, { position = k.vec2(), width = 0 } = {}) {
        const outerContainer = parent.add([
            k.rect(width || 180, 400),
            k.pos(position),
            k.area(),
            k.color(k.WHITE),
            k.outline(1, k.WHITE),
            k.ui({ type: "custom" }),
            k.mask("intersect")
        ]);

        const innerContainer = outerContainer.add([
            k.rect(width || 150, 400),
            k.pos(position),
            k.area(),
            k.color(k.WHITE),
            k.outline(1, k.WHITE),
            k.layout({ type: "column" }),
        ]);

        const slider = newSlider(outerContainer, {
            position: k.vec2(outerContainer.width - 20, 0),
            size: k.vec2(20, outerContainer.height),
            orientation: "vertical"
        })
        slider.gutter.pos = k.vec2(1, 1);
        slider.gutter.width = 18;
        slider.gutter.height = outerContainer.height - 2;
        slider.thumb.height = 200;
        slider.value = 0;

        function maxScroll() {
            return outerContainer.height - innerContainer.height;
        }

        function scrollToPos(pos: number) {
            innerContainer.pos.y = k.lerp(0, maxScroll(), pos);
        }

        slider.onValueChanged(value => {
            scrollToPos(value);
        })

        let dragId: MouseButton | null;

        innerContainer.onMousePress(button => {
            if (innerContainer.isHovering()) {
                dragId = button;
            }
        });

        innerContainer.onScroll(delta => {
            if (innerContainer.isHovering()) {
                scrollToPos(slider.value = k.clamp(slider.value + delta.y / maxScroll(), 0, 1));
            }
        })

        innerContainer.onMouseMove(button => {
            if (dragId) {
                scrollToPos(slider.value = k.clamp(slider.value + k.mouseDeltaPos().y / maxScroll(), 0, 1));
            }
        });

        innerContainer.onMouseRelease(button => {
            dragId = null;
        });

        for (let i = 0; i < 20; i++) {
            innerContainer.add([
                k.text(`item ${i}`),
                k.area(),
                k.color(k.BLACK)
            ])
        }

        const size = innerContainer.doLayout();
        [innerContainer.width, innerContainer.height] = [size.x, size.y];
    }

    // region list view
    const window3 = newWindow("List", { position: k.vec2(635, 50) });

    newListView(window3.panel, {});

    resizeWindow(window3, window3.panel.doLayout());
});

k.onKeyPress("enter", () => k.uiInput.push(true));
k.onKeyRelease("enter", () => k.uiInput.push(false));
k.onKeyPress("tab", () => k.uiInput.navigate(!k.isKeyDown("shift")));
k.onKeyRelease("left", () => k.uiInput.dragSlider(k.isKeyDown("shift") ? -.1 : -.01));
k.onKeyRelease("right", () => k.uiInput.dragSlider(k.isKeyDown("shift") ? .1 : .01));
