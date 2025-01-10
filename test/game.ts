import kaplay from "kaplay";
import uiPlugin from "../src/plugin";

const k = kaplay({
    plugins: [uiPlugin],
});

k.loadBean();
k.loadAseprite("ui", "/sprites/ui.png", "/sprites/ui.json")
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

    function resizeWindow(size) {
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
    function newButton(parent, { position = k.vec2(), label = "", width = 0 } = {}) {
        const dimensions = k.formatText({ text: label, size: 20 })
        width = dimensions.width + 16 + 6
        const height = 20 + 4
        const button = parent.add([
            k.rect(width, height),
            k.pos(position),
            k.area(),
            k.color(k.WHITE),
            k.outline(1, k.WHITE),
            k.ui({ type: "button" })
        ])
        button.add([
            k.sprite("button", { width: width - 2, height: height - 2 }),
            k.pos(1, 1)
        ])
        button.add([
            k.text(label, {
                size: 20
            }),
            k.pos(width / 2, 12),
            k.anchor("center"),
            k.color(k.BLACK)
        ])

        button.onPressed(() => { button.children[0].use(k.sprite("buttonpressed", { width: width - 2, height: height - 2 })); })
        button.onReleased(() => { button.children[0].use(k.sprite("button", { width: width - 2, height: height - 2 })); })
        button.onFocus(() => { button.outline.color = k.BLACK; })
        button.onBlur(() => { button.outline.color = k.WHITE; })

        return button
    }

    const button = newButton(panel, { position: k.vec2(80, 20), label: "Action", width: 80 })
    button.onAction(() => { k.shake(); })

    /**
     * Create a checkbox
     * @param parent Parent to attach the button to
     * @param opt Options 
     * @returns The newly attached checkbox
     */
    function newCheckBox(parent, { position = k.vec2(), label = "", group = "", width = 0 } = {}) {
        const dimensions = k.formatText({ text: label, size: 20 })
        const checkbox = parent.add([
            k.rect(dimensions.width + 16 + 6, 20 + 4),
            k.pos(position),
            k.area(),
            k.color(k.WHITE),
            k.outline(1, k.WHITE),
            k.ui({ type: "checkbox" })
        ])
        checkbox.add([
            k.sprite("ui", { frame: 0 }),
            k.pos(0, 12),
            k.anchor("left")
        ])
        checkbox.add([
            k.text(label, { size: 20 }),
            k.pos(20, 12),
            k.anchor("left"),
            k.color(k.BLACK)
        ])

        checkbox.onChecked(checked => { checkbox.children[0].frame = checked ? 1 : 0; })
        checkbox.onFocus(() => { checkbox.outline.color = k.BLACK; })
        checkbox.onBlur(() => { checkbox.outline.color = k.WHITE; })

        return checkbox
    }

    const checkbox = newCheckBox(panel, { position: k.vec2(80, 80), label: "Visible", width: 110 })
    checkbox.onReleased(() => { panel.opacity = checkbox.isChecked() ? 1.0 : 0.0; })
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

    radio1.onChecked(checked => { if (checked) { panel.type = "row"; resizeWindow(panel.doLayout()); } })
    radio2.onChecked(checked => { if (checked) { panel.type = "column"; resizeWindow(panel.doLayout()); } })
    radio2.setChecked(true)
    radio3.onChecked(checked => { if (checked) { panel.type = "grid"; resizeWindow(panel.doLayout()); } })
    radio4.onChecked(checked => { if (checked) { panel.type = "flex"; resizeWindow(panel.doLayout()); } })

    /**
     * Create a slider
     * @param parent Parent to attach the slider to
     * @param opt Options 
     * @returns The newly attached slider
     */
    function newSlider(parent, { position = k.vec2(), label = "", group = "", width = 0 } = {}) {
        const slider = parent.add([
            k.rect(100, 20),
            k.pos(position),
            k.area(),
            k.color(k.WHITE),
            k.outline(1, k.WHITE),
        ])
        const rail = slider.add([
            k.sprite("buttonpressed", { width: slider.width - 8, height: 4 }),
            k.pos(4, 8),
        ]);
        const thumb = slider.add([
            k.sprite("button", { width: 10, height: 20 - 4 }),
            k.pos(2, 2),
            k.area(),
            k.ui({ type: "sliderthumb" })
        ])

        thumb.onFocus(() => { slider.outline.color = k.BLACK; })
        thumb.onBlur(() => { slider.outline.color = k.WHITE; })

        slider.thumb = thumb

        return slider
    }

    const slider = newSlider(panel, { position: k.vec2(80, 260) })

    slider.thumb.onValueChanged(value => k.debug.log(`Slider set to ${value}`))

    resizeWindow(panel.doLayout());
});