import kaplay from "kaplay";
import uiPlugin from "../src/plugin";

const k = kaplay({
    plugins: [uiPlugin],
});

k.loadAseprite("ui", "/sprites/ui.png", "/sprites/ui.json")
k.loadSprite("button", "/sprites/button.png", { slice9: { left: 3, top: 3, right: 3, bottom: 3 } })
k.loadSprite("buttonpressed", "/sprites/buttonpressed.png", { slice9: { left: 3, top: 3, right: 3, bottom: 3 } })

const panel = k.add([
    k.rect(5 + 170 + 5, k.height()),
    k.color(k.WHITE),
    k.opacity(1.0),
    k.layout({ type: "column", padding: 5, spacing: 5, columns: 2, maxWidth: 170 })
])

function newButton({ position = k.vec2(), label = "", width = 0 } = {}) {
    const dimensions = k.formatText({ text: label, size: 20 })
    width = dimensions.width + 16 + 6
    const height = 20 + 4
    const button = panel.add([
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

const button = newButton({ position: k.vec2(80, 20), label: "Action", width: 80 })
button.onAction(() => { k.shake(); })

function newCheckBox({ position = k.vec2(), label = "", group = "", width = 0 } = {}) {
    const dimensions = k.formatText({ text: label, size: 20 })
    const checkbox = panel.add([
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

    //checkbox.onPressed(() => { checkbox.color = GREEN; })
    //checkbox.onReleased(() => { checkbox.color = checkbox.isChecked() ? RED : BLUE; })
    checkbox.onChecked(checked => { checkbox.children[0].frame = checked ? 1 : 0; })
    checkbox.onFocus(() => { checkbox.outline.color = k.BLACK; })
    checkbox.onBlur(() => { checkbox.outline.color = k.WHITE; })

    return checkbox
}

const checkbox = newCheckBox({ position: k.vec2(80, 80), label: "Visible", width: 110 })
checkbox.onReleased(() => { panel.opacity = checkbox.isChecked() ? 1.0 : 0.0; })
checkbox.setChecked(true)

function newRadio({ position = k.vec2(), label = "", group = "", width = 0 } = {}) {
    const dimensions = k.formatText({ text: label, size: 20 })
    const radio = panel.add([
        k.rect(dimensions.width + 16 + 6, 20 + 4),
        k.pos(position),
        k.area(),
        k.color(k.WHITE),
        k.outline(1, k.WHITE),
        k.ui({ type: "radiobutton", group: "radiogroup" })
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

    //radio.onPressed(() => {  })
    //radio.onReleased(() => {  })
    radio.onChecked(checked => { radio.children[0].frame = checked ? 3 : 2; })
    radio.onFocus(() => { radio.outline.color = k.BLACK; })
    radio.onBlur(() => { radio.outline.color = k.WHITE; })

    return radio
}

const radio1 = newRadio({ position: k.vec2(80, 120), label: "Row", width: 60, group: "radiogroup" })
const radio2 = newRadio({ position: k.vec2(80, 160), label: "Column", width: 95, group: "radiogroup" })
const radio3 = newRadio({ position: k.vec2(80, 200), label: "Grid", width: 75, group: "radiogroup" })
const radio4 = newRadio({ position: k.vec2(80, 240), label: "Flex", width: 75, group: "radiogroup" })

radio1.onChecked(checked => { if (checked) panel.type = "row"; })
radio2.onChecked(checked => { if (checked) panel.type = "column"; })
radio2.setChecked(true)
radio3.onChecked(checked => { if (checked) panel.type = "grid"; })
radio4.onChecked(checked => { if (checked) panel.type = "flex"; })
