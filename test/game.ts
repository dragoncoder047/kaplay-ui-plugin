import kaplay, { GfxCtx, ImageSource, Texture, TextureOpt } from "kaplay";
import uiPlugin from "../src/plugin";
import { debug } from "console";

const k = kaplay({
    plugins: [uiPlugin],
});

k.loadBean();
k.loadAseprite("ui", "/sprites/ui.png", "/sprites/ui.json")
k.loadAseprite("media", "/sprites/media.png", "/sprites/media.json")
k.loadSprite("button", "/sprites/button.png", { slice9: { left: 3, top: 3, right: 3, bottom: 3 } })
k.loadSprite("buttonpressed", "/sprites/buttonpressed.png", { slice9: { left: 3, top: 3, right: 3, bottom: 3 } })

k.onLoad(() => {
    const window = k.add([
        k.pos(200, 100),
        k.sprite("button", { width: 320, height: 250 }),
        k.area()
    ])

    const titlebar = window.add([
        k.pos(2, 2),
        k.rect(320 - 4, 25),
        k.area(),
        k.color(80, 80, 255),
        k.ui({ type: "dragitem", proxy: window })
    ])

    const panel = window.add([
        k.pos(2, 2 + 25 + 2),
        k.rect(320 - 4, 250 - 2 - 25 - 2 - 2),
        k.color(k.WHITE),
        k.opacity(1.0),
        k.layout({ type: "column", padding: 5, spacing: 5, columns: 2, maxWidth: 170 })
    ])

    panel.add([
        k.pos(0, 0),
        k.sprite("bean")
    ])

    function resizeWindow(window, titlebar, panel, size) {
        [panel.width, panel.height] = [size.x, size.y];
        [window.width, window.height] = [size.x + 4, 2 + 25 + 2 + size.y + 2];
        titlebar.width = size.x
    }

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

    const button = newButton(panel, { position: k.vec2(80, 20), label: "Action" })
    button.onAction(() => { k.shake(); })

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

    const checkbox = newCheckBox(panel, { position: k.vec2(80, 80), label: "Visible" })
    checkbox.onChecked(checked => { panel.opacity = checked ? 1.0 : 0.0; })
    checkbox.setChecked(true)

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

    const radio1 = newRadio(panel, { position: k.vec2(80, 120), label: "Row", width: 60, group: "radiogroup" })
    const radio2 = newRadio(panel, { position: k.vec2(80, 160), label: "Column", width: 95, group: "radiogroup" })
    const radio3 = newRadio(panel, { position: k.vec2(80, 200), label: "Grid", width: 75, group: "radiogroup" })
    const radio4 = newRadio(panel, { position: k.vec2(80, 240), label: "Flex", width: 75, group: "radiogroup" })

    radio1.onChecked(checked => { if (checked) { panel.type = "row"; resizeWindow(window, titlebar, panel, panel.doLayout()); } })
    radio2.onChecked(checked => { if (checked) { panel.type = "column"; resizeWindow(window, titlebar, panel, panel.doLayout()); } })
    radio2.setChecked(true)
    radio3.onChecked(checked => { if (checked) { panel.type = "grid"; resizeWindow(window, titlebar, panel, panel.doLayout()); } })
    radio4.onChecked(checked => { if (checked) { panel.type = "flex"; resizeWindow(window, titlebar, panel, panel.doLayout()); } })

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

        slider.thumb = thumb

        return slider
    }

    const slider = newSlider(panel, { position: k.vec2(80, 260), label: "Red" })
    slider.value = 1;

    slider.onValueChanged(value => {
        k.debug.log(`Slider set to ${value}`)
        panel.color = k.rgb(value * 255, 255, 255)
    })

    /**
     * Create a dropdown
     * @param parent Parent to attach the dropdown to
     * @param opt Options 
     * @returns The newly attached dropdown
     */
    function newGroupBox(parent, { position = k.vec2(), label = "", group = "", width = 0 } = {}) {
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
        collapse.onChecked((checked) => {
            collapsed = checked;
            collapse.text = (collapsed ? "► " : "▼ ") + label;
            // TODO: show/hide content and adjust size
        });

        return box;
    }

    newGroupBox(panel, { label: "Crew settings" });

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

        // TODO: Fix draw order, since the menu needs to be drawn on top of everything else
        button.onAction(() => {
            const menu = newMenu(button, { position: k.vec2(0, 24), items: options })
        })

        return dropdown;
    }

    newDropdown(panel, { position: k.vec2(80, 280), label: "Crew", width: 0, options: ["bean", "beant"], selected: "bean" });

    type MenuHideOption = "destroy" | "hide"
    function newMenu(parent, { position = k.vec2(), label = "", items = [""], hideOption = "destroy" } = {}) {
        const menu = parent.add([
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

    resizeWindow(window, titlebar, panel, panel.doLayout());

    const window2 = k.add([
        k.pos(400, 100),
        k.sprite("button", { width: 320, height: 250 }),
        k.area()
    ])

    const titlebar2 = window2.add([
        k.pos(2, 2),
        k.rect(320 - 4, 25),
        k.area(),
        k.color(80, 80, 255),
        k.ui({ type: "dragitem", proxy: window2 })
    ])
    titlebar2.add([
        k.pos(4, 14),
        k.text("KVideo: UFO S01E01.mp4", {
            size: 20
        }),
        k.anchor("left")
    ])

    const panel2 = window2.add([
        k.pos(2, 2 + 25 + 2),
        k.rect(320 - 4, 250 - 2 - 25 - 2 - 2),
        k.color(k.WHITE),
        k.opacity(1.0),
        k.layout({ type: "column", padding: 5, spacing: 5, columns: 1, maxWidth: 170 })
    ])

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
            set currentTime(time) {
                _video.currentTime = time;
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
            get muted() {
                return _video.muted;
            },
            set muted(muted) {
                _video.muted = muted;
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

    const videoPlane = panel2.add([
        k.area({ shape: new k.Rect(k.vec2(), 320 - 4, 250 - 2 - 25 - 2 - 2) }),
        k.ui({ type: "custom" }),
        //video("https://archive.org/download/ufo-s-01-e-01-identified/UFO%20S01E01%20-%20Identified.mp4", 320 - 4, 250 - 2 - 25 - 2 - 2)
        video("/sprites/UFO S01E01 - Identified.mp4", 320 - 4, 250 - 2 - 25 - 2 - 2)
    ])

    const panel3 = panel2.add([
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
    mute.onChecked((checked) => { videoPlane.muted = checked });
    mute.setChecked(true);

    panel3.doLayout();

    resizeWindow(window2, titlebar2, panel2, panel2.doLayout());
});