import kaplay, { AreaComp, Color, ColorComp, Comp, FixedComp, FormattedText, Game, GameObj, GfxCtx, ImageSource, KEventController, PosComp, TextComp, Texture, TextureOpt } from "kaplay";
import uiPlugin, { LayoutType } from "../src/plugin";

const k = kaplay({
    plugins: [uiPlugin],
});

k.loadBean();
k.loadAseprite("ui", "/sprites/ui.png", "/sprites/ui.json")
k.loadAseprite("media", "/sprites/media.png", "/sprites/media.json")
k.loadSprite("button", "/sprites/button.png", { slice9: { left: 3, top: 3, right: 3, bottom: 3 } })
k.loadSprite("buttonpressed", "/sprites/buttonpressed.png", { slice9: { left: 3, top: 3, right: 3, bottom: 3 } })

k.onLoad(() => {
    // region window
    interface WindowComp extends Comp {
        titlebar: GameObj;
        panel: GameObj;
        title: string;
    }

    function newWindow(title: string, {
        position = k.vec2(0), // window position
        size = k.vec2(0) // window size
    } = {}): GameObj<PosComp | AreaComp | WindowComp> {
        const dimensions = k.formatText({ text: title, size: 20 });

        const window = k.add([
            k.pos(position),
            k.sprite("button", { width: size.x + 4, height: 2 + 25 + 2 + size.y + 2 }),
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

    function resizeWindow(window, size) {
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
    function newButton(parent, { position = k.vec2(), label = "", sprite = "", frame = 0, layout = { padding: [3, 2] } } = {}) {
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
        const buttonBg = button.add([
            k.sprite("button", { width: width - 2, height: height - 2 }),
            k.pos(1, 1)
        ])
        // Icon
        let icon;
        if (sprite) {
            icon = button.add([
                k.pos(0, layout.padding[1] + dimensions.height),
                k.sprite(sprite, { frame: frame }),
                k.anchor("top")
            ])
            width = Math.max(width, icon.width)
            height += icon.height
            icon.pos.x = width / 2;
        }
        // Label
        button.add([
            k.text(label, {
                size: 20
            }),
            k.pos(width / 2, (dimensions.height + layout.padding[1] * 2) / 2 + 1 + (icon ? icon.height : 0)),
            k.anchor("center"),
            k.color(k.BLACK)
        ])
        // Resize button and bg
        button.width = width
        button.height = height
        buttonBg.width = width - 2
        buttonBg.height = height - 2

        button.onPressed(() => { button.children[0].use(k.sprite("buttonpressed", { width: width - 2, height: height - 2 })); })
        button.onReleased(() => { button.children[0].use(k.sprite("button", { width: width - 2, height: height - 2 })); })
        button.onFocus(() => { button.outline.color = k.BLACK; })
        button.onBlur(() => { button.outline.color = k.WHITE; })

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
    function newCheckBox(parent, { position = k.vec2(), label = "", sprite = "", frames = [0], group = "" } = {}) {
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
        // Icon
        let icon;
        let buttonBg;
        if (sprite) {
            buttonBg = checkbox.add([
                k.sprite("button", { width: width - 2, height: height - 2 }),
                k.pos(1, 1)
            ]);
            icon = checkbox.add([
                k.pos(0, 2 + dimensions.height),
                k.sprite(sprite, { frame: frames[0] }),
                k.anchor("top")
            ]);
            width = Math.max(width, icon.width);
            height += icon.height;
            icon.pos.x = width / 2;
        }
        else {
            icon = checkbox.add([
                k.sprite("ui", { frame: 0 }),
                k.pos(0, 12),
                k.anchor("left")
            ]);
        }
        checkbox.add([
            k.text(label, { size: 20 }),
            k.pos(20, 12),
            k.anchor("left"),
            k.color(k.BLACK)
        ]);
        // Resize button and bg
        checkbox.width = width;
        checkbox.height = height;
        if (buttonBg) {
            buttonBg.width = width - 2;
            buttonBg.height = height - 2;

            checkbox.onPressed(() => { buttonBg.use(k.sprite("buttonpressed", { width: width - 2, height: height - 2 })); });
            checkbox.onReleased(() => { buttonBg.use(k.sprite("button", { width: width - 2, height: height - 2 })); });
        }
        if (sprite) {
            checkbox.onChecked(checked => { icon.frame = checked ? frames[0] : frames[1]; });
        }
        else {
            checkbox.onChecked(checked => { icon.frame = checked ? 1 : 0; });
        }
        checkbox.onFocus(() => { checkbox.outline.color = k.BLACK; });
        checkbox.onBlur(() => { checkbox.outline.color = k.WHITE; });

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
    function newRadio(parent, { position = k.vec2(), label = "", group = "", width = 0 } = {}) {
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
            k.sprite("ui", { frame: 2 }),
            k.pos(0, 12),
            k.anchor("left")
        ])
        radio.add([
            k.text(label, {
                size: 20
            }),
            k.pos(20, 12),
            k.anchor("left"),
            k.color(k.BLACK)
        ])

        radio.onChecked(checked => { radio.children[0].frame = checked ? 3 : 2; })
        radio.onFocus(() => { radio.outline.color = k.BLACK; })
        radio.onBlur(() => { radio.outline.color = k.WHITE; })

        return radio
    }

    const radio1 = newRadio(window.panel, { position: k.vec2(80, 120), label: "Row", width: 60, group: "radiogroup" })
    const radio2 = newRadio(window.panel, { position: k.vec2(80, 160), label: "Column", width: 95, group: "radiogroup" })
    const radio3 = newRadio(window.panel, { position: k.vec2(80, 200), label: "Grid", width: 75, group: "radiogroup" })
    const radio4 = newRadio(window.panel, { position: k.vec2(80, 240), label: "Flex", width: 75, group: "radiogroup" })

    radio1.onChecked(checked => { if (checked) { window.panel.type = "row"; resizeWindow(window, window.panel.doLayout()); } })
    radio2.onChecked(checked => { if (checked) { window.panel.type = "column"; resizeWindow(window, window.panel.doLayout()); } })
    radio2.setChecked(true)
    radio3.onChecked(checked => { if (checked) { window.panel.type = "grid"; resizeWindow(window, window.panel.doLayout()); } })
    radio4.onChecked(checked => { if (checked) { window.panel.type = "flex"; resizeWindow(window, window.panel.doLayout()); } })

    // region slider
    /**
     * Create a slider
     * @param parent Parent to attach the slider to
     * @param opt Options 
     * @returns The newly attached slider
     */
    function newSlider(parent, { position = k.vec2(), label = "", group = "", width = 0 } = {}) {
        const dimensions = k.formatText({ text: label, size: 20 })
        const slider = parent.add([
            k.rect(100, 20 + dimensions.height),
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
        const rail = slider.add([
            k.sprite("buttonpressed", { width: slider.width - 8, height: 4 }),
            k.pos(4, y + 8),
        ]);
        const thumb = slider.add([
            k.sprite("button", { width: 10, height: 20 - 4 }),
            k.pos(2, y + 2),
            k.area(),
            k.ui({ type: "sliderthumb" })
        ])
        // Proxy so we can use slider directly
        slider.use({
            id: "slider",
            get thumb() { return thumb },
            get value() {
                return thumb.value;
            },
            set value(value) {
                thumb.value = value;
            },
            onValueChanged(cb) {
                thumb.onValueChanged(cb);
            }
        })

        thumb.onFocus(() => { slider.outline.color = k.BLACK; })
        thumb.onBlur(() => { slider.outline.color = k.WHITE; })

        return slider
    }

    const slider = newSlider(window.panel, { position: k.vec2(80, 260), label: "Red" })
    slider.value = 1;

    slider.onValueChanged(value => {
        k.debug.log(`Slider set to ${value}`)
        window.panel.color = k.rgb(value * 255, 255, 255)
    })

    // region group box
    /**
     * Create a group box
     * @param parent Parent to attach the group box to
     * @param opt Options 
     * @returns The newly attached group box
     */
    function newGroupBox(parent, { position = k.vec2(), label = "", layout = "column" } = {}) {
        const dimensions = k.formatText({ text: "  " + label, size: 20 })
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
                collapse.onChecked((checked) => {
                    cb(checked)
                });
            },
        })

        return box;
    }

    const box = newGroupBox(window.panel, { label: "Crew settings" });

    // region dropdown
    /**
     * Create a dropdown
     * @param parent Parent to attach the dropdown to
     * @param opt Options 
     * @returns The newly attached dropdown
     */
    function newDropdown(parent, { position = k.vec2(), label = "", group = "", width = 0, options = [""], selected = "" } = {}) {
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
            k.sprite("button", { width: dropdown.width, height: 24 }),
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
    newDropdown(box.content, { position: k.vec2(80, 280), label: "Crew", width: 0, options: ["bean", "beant"], selected: "bean" });

    // region menu
    type MenuHideOption = "destroy" | "hide"
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
                onValueChanged(cb) {
                    this.on("valueChanged", cb)
                },
                hide() {
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

    interface Edit {
        text: string;
        color: Color;
        cursor: number;
        selection?: string;
        select(start: number, length: number): string;
    }

    interface EditChangeDelegate {
        canFocus(): boolean;
        editBegin(): void;
        canChange(edit: Edit, start: number, length: number, replacement: string): boolean;
        editEnd(): void;
    }

    // region edit
    /**
     * Create an edit control
     * @param parent Parent to attach the edit control to
     * @param opt Options 
     * @returns The newly attached edit control
     */
    function newEdit(parent, { position = k.vec2(), label = "", width = 0, value = "", size = 20, font = undefined, changeDelegate = undefined } = {}) {
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
        ]);
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
                    text.text = str;
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
                            text.text = str;
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
                selectionStart = index;
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

    // region temporary texture copy

    class Texture {
        ctx: GfxCtx;
        src: null | ImageSource = null;
        glTex: WebGLTexture;
        width: number;
        height: number;

        constructor(ctx: GfxCtx, w: number, h: number, opt: TextureOpt = {}) {
            this.ctx = ctx;

            const gl = ctx.gl;
            const glText = ctx.gl.createTexture();

            if (!glText) {
                throw new Error("Failed to create texture");
            }

            this.glTex = glText;
            ctx.onDestroy(() => this.free());

            this.width = w;
            this.height = h;

            const filter = {
                "linear": gl.LINEAR,
                "nearest": gl.NEAREST,
            }[opt.filter ?? ctx.opts.texFilter ?? "nearest"];

            const wrap = {
                "repeat": gl.REPEAT,
                "clampToEdge": gl.CLAMP_TO_EDGE,
            }[opt.wrap ?? "clampToEdge"];

            this.bind();

            if (w && h) {
                gl.texImage2D(
                    gl.TEXTURE_2D,
                    0,
                    gl.RGBA,
                    w,
                    h,
                    0,
                    gl.RGBA,
                    gl.UNSIGNED_BYTE,
                    null,
                );
            }

            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap);
            gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
            this.unbind();
        }

        static fromImage(
            ctx: GfxCtx,
            img: ImageSource,
            opt: TextureOpt = {},
        ): Texture {
            const tex = new Texture(ctx, img.width, img.height, opt);
            tex.update(img);
            tex.src = img;
            return tex;
        }

        update(img: ImageSource, x = 0, y = 0) {
            const gl = this.ctx.gl;
            this.bind();
            gl.texSubImage2D(
                gl.TEXTURE_2D,
                0,
                x,
                y,
                gl.RGBA,
                gl.UNSIGNED_BYTE,
                img,
            );
            this.unbind();
        }

        bind() {
            this.ctx.pushTexture2D(this.glTex);
        }

        unbind() {
            this.ctx.popTexture2D();
        }

        /** Frees up texture memory. Call this once the texture is no longer being used to avoid memory leaks. */
        free() {
            this.ctx.gl.deleteTexture(this.glTex);
        }
    }

    // region video
    function video(url: string, width, height) {
        const _video: HTMLVideoElement = document.createElement("video");
        let _playing = false;
        let _timeupdate = false;
        let _canCopyVideo = false;
        let _texture = new Texture(k._k.gfx.ggl, width, height);
        return {
            width,
            height,
            get currentTime() {
                return _video.currentTime;
            },
            set currentTime(value) {
                _video.currentTime = value;
            },
            get duration() {
                return _video.duration;
            },
            play() {
                _video.play();
            },
            pause() {
                _video.pause();
            },
            get mute() {
                return _video.muted;
            },
            set mute(value) {
                _video.muted = value;
            },
            add() {
                _video.playsInline = true;
                //_video.muted = true; Don't use this, sound will not work
                _video.loop = true;
                _video.autoplay = false;
                _video.crossOrigin = 'anonymous';

                _video.addEventListener(
                    "playing",
                    () => {
                        _playing = true;
                        updateCopyFlag();
                    },
                    true,
                );

                _video.addEventListener(
                    "timeupdate",
                    () => {
                        _timeupdate = true;
                        updateCopyFlag();
                    },
                    true,
                );

                if (url.startsWith("http")) { // Make sure redirects work
                    console.log(`Fetching ${url}`)
                    fetch(url, {
                        method: 'HEAD',
                        mode: 'no-cors'
                    }).then((response) => {
                        _video.src = response.url ? response.url : url;
                    });
                }
                else {
                    console.log(`Not fetching ${url}`)
                    _video.src = url;
                }

                function updateCopyFlag() {
                    if (_playing && _timeupdate) {
                        _canCopyVideo = true;
                    }
                }
            },
            update() {
                if (_canCopyVideo) {
                    const gl = k._k.gfx.ggl.gl;
                    _texture.bind();
                    gl.texImage2D(
                        gl.TEXTURE_2D,
                        0,
                        gl.RGBA,
                        gl.RGBA,
                        gl.UNSIGNED_BYTE,
                        _video,
                    );
                    _texture.unbind();
                }
            },
            draw() {
                if (_canCopyVideo) {
                    k.drawSprite({
                        sprite: "bean"
                    });
                    k.drawUVQuad({
                        width: this.width,
                        height: this.height,
                        tex: _texture
                    });
                }
            }
        }
    }

    // region video window
    const window2 = newWindow("KVideo: UFO S01E01.mp4", { position: k.vec2(300, 50) });

    const videoPlane = window2.panel.add([
        k.area({ shape: new k.Rect(k.vec2(), 320 - 4, 250 - 2 - 25 - 2 - 2) }),
        k.ui({ type: "custom" }),
        //video("https://archive.org/download/ufo-s-01-e-01-identified/UFO%20S01E01%20-%20Identified.mp4", 320 - 4, 250 - 2 - 25 - 2 - 2)
        video("/sprites/UFO S01E01 - Identified.mp4", 320 - 4, 250 - 2 - 25 - 2 - 2)
    ])

    const panel3 = window2.panel.add([
        k.pos(0, 0),
        k.rect(320 - 4, 25),
        k.color(k.WHITE),
        k.opacity(1.0),
        k.layout({ type: "row", padding: 0, spacing: 5, maxWidth: 320 - 4 })
    ])

    newButton(panel3, { sprite: "media", frame: 1 }).onAction(() => { videoPlane.pause() });
    newButton(panel3, { sprite: "media", frame: 0 }).onAction(() => { videoPlane.play() });
    const seek = newSlider(panel3, {});
    seek.onValueChanged((value) => {
        videoPlane.currentTime = value * videoPlane.duration;
    });
    seek.onUpdate(() => {
        seek.value = videoPlane.currentTime / videoPlane.duration;
    });
    const mute = newCheckBox(panel3, { sprite: "media", frames: [3, 2] })
    mute.onChecked((checked) => { videoPlane.mute = checked });
    mute.setChecked(true);

    panel3.doLayout();

    resizeWindow(window2, window2.panel.doLayout());
});