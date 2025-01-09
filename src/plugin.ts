import { KAPLAYCtx, Comp, GameObj, Vec2, KEventController } from "kaplay";

type UiType = "button" | "radiobutton" | "checkbox";
type UiElementCompOpt = {
    type?: UiType;
    group?: string;
    checked?: boolean;
};
interface UiElementComp extends Comp {
    onPressed(action: any): KEventController;
    onReleased(action: any): KEventController;
    onChecked(action: any): KEventController;
    onFocus(action: any): KEventController;
    onBlur(action: any): KEventController;
    onAction(action: any): KEventController;
    isPressed(): boolean;
    isChecked(): boolean;
    setChecked(checked: boolean): void;
    setFocus(): void;
}
type LayoutType = "row" | "column" | "grid" | "flex";
type LayoutElementCompOpt = {
    type?: LayoutType;
    padding?: number;
    spacing?: number;
    columns?: number;
    maxWidth?: number;
};
interface LayoutElementComp extends Comp {
    doLayout(): void;
    type: LayoutType;
    padding: Vec2;
    spacing: Vec2;
    columns?: number;
    maxWidth: number;
}

export default function kaplayUi(k: KAPLAYCtx) {

    function getFocus(): GameObj | undefined {
        let focus
        k.get("focus", { recursive: true }).forEach(uiElement => {
            focus = uiElement
        })
        return focus
    }

    k.onKeyPress("enter", () => {
        const focus = getFocus()
        if (focus) {
            focus.tag("pressed")
            focus.trigger("pressed")
        }
    });

    k.onKeyRelease("enter", () => {
        const focus = getFocus()
        if (focus /*&& focus.is("pressed")*/) { // TODO: why isn't it pressed?
            focus.tag("pressed")
            if (focus.is("button")) {
                focus.trigger("action")
            }
            focus.trigger("released")
        }
    });

    k.onKeyPress("tab", () => {
        const focus = getFocus()
        const uiElements = k.get("canfocus", { recursive: true })
        if (focus) {
            const index = uiElements.indexOf(focus)
            const direction = k.isKeyPressed("shift") ? -1 : 1
            if (index >= 0) {
                let nextFocus = uiElements[(index + direction) % uiElements.length]
                nextFocus.setFocus()
                return
            }
        }
        uiElements[0].setFocus()
    })

    return {
        ui(opt: UiElementCompOpt): UiElementComp {
            const _type: UiType = opt.type || "button";
            if (_type === "radiobutton" && !opt.group) {
                throw new Error("Radiobuttons need a group");
            }
            const _group = opt.group || null
            return {
                id: "ui",
                add(this: GameObj) {
                    // Initialisation
                    this.tag(_type)
                    this.tag("canfocus")
                    switch (_type) {
                        // @ts-ignore
                        case "radiobutton":
                            if (_group) {
                                this.tag(_group)
                            }
                        // fallthrough
                        case "checkbox":
                            if (opt.checked) {
                                this.setChecked(true)
                            }
                            break;
                    }
                    this.onClick(() => {
                        this.tag("pressed")
                        this.setFocus()
                        this.trigger("pressed")
                    });
                    this.onUpdate(() => {
                        if (!k.isMouseDown() && this.is("pressed")) {
                            this.untag("pressed")
                            if (_type === "button") {
                                if (this.isHovering()) {
                                    this.trigger("action")
                                }
                            }
                            else if (_type === "checkbox") {
                                this.setChecked(!this.isChecked())
                            }
                            else if (_type === "radiobutton") {
                                if (!this.isChecked()) {
                                    k.get(["radio", _group!], { recursive: true }).forEach((radio: GameObj) => {
                                        if (radio !== this) {
                                            radio.setChecked(false)
                                        }
                                    })
                                    this.setChecked(true)
                                }
                            }
                            this.trigger("released")
                        }
                    })
                },
                onPressed(this: GameObj, action: any) {
                    return this.on("pressed", action)
                },
                onReleased(this: GameObj, action: any) {
                    return this.on("released", action)
                },
                onChecked(this: GameObj, action: any) {
                    return this.on("checked", () => {
                        action(this.isChecked())
                    })
                },
                onFocus(this: GameObj, action: any) {
                    return this.on("focus", action)
                },
                onBlur(this: GameObj, action: any) {
                    return this.on("blur", action)
                },
                onAction(this: GameObj, action: any) {
                    return this.on("action", action)
                },
                isPressed(this: GameObj) {
                    return this.is("pressed")
                },
                isChecked(this: GameObj) {
                    return this.is("checked")
                },
                setChecked(this: GameObj, checked: boolean) {
                    if (checked) {
                        this.tag("checked")
                    }
                    else {
                        this.untag("checked")
                    }
                    this.trigger("checked", checked)
                },
                setFocus(this: GameObj) {
                    k.get("focus", { recursive: true }).forEach((uiElement: GameObj) => {
                        if (uiElement !== this) {
                            uiElement.untag("focus")
                            uiElement.trigger("blur")
                        }
                    })
                    this.tag("focus")
                    this.trigger("focus")
                }
            }
        },
        layout(opt: LayoutElementCompOpt): LayoutElementComp {
            let _type = opt.type || "row"
            let _padding = k.vec2(opt.padding ?? 0)
            let _spacing = k.vec2(opt.spacing ?? 0)
            let _columns = opt.columns
            let _maxWidth = opt.maxWidth ?? Infinity
            return {
                add(this: GameObj) {
                    // Initialisation
                    this.tag(_type)
                    this.doLayout()
                },
                doLayout(this: GameObj) {
                    switch (_type) {
                        case "row":
                            {
                                let pos = _padding
                                this.children.forEach((child: GameObj) => {
                                    child.pos = pos
                                    pos = pos.add(child.width + _spacing.x, 0)
                                })
                                break
                            }
                        case "column":
                            {
                                let pos = _padding
                                this.children.forEach((child: GameObj) => {
                                    child.pos = pos
                                    pos = pos.add(0, child.height + _spacing.y)
                                })
                                break
                            }
                        case "grid":
                            {
                                // Fix vertical position, collect column width for second pass
                                let pos = k.vec2(_padding)
                                let column = 0
                                let maxHeight = 0
                                let columnWidth: number[] = []
                                this.children.forEach((child: GameObj) => {
                                    child.pos = k.vec2(pos)
                                    maxHeight = Math.max(maxHeight, child.height)
                                    columnWidth[column] = Math.max(columnWidth[column] || 0, child.width)
                                    column++
                                    if (column === _columns) {
                                        pos.y += maxHeight + _spacing.y
                                        column = 0
                                        maxHeight = 0
                                    }
                                })
                                // Fix horizontal position
                                let x = k.vec2(_padding).x
                                column = 0
                                this.children.forEach((child: GameObj) => {
                                    child.pos.x = x
                                    x += columnWidth[column] + _spacing.x
                                    column++
                                    if (column === _columns) {
                                        x = _spacing.x
                                        column = 0
                                    }
                                })
                                break
                            }
                        case "flex":
                            {
                                let pos = k.vec2(_padding)
                                let column = 0
                                let maxHeight = 0
                                this.children.forEach((child: GameObj) => {
                                    child.pos = k.vec2(pos)
                                    column++
                                    if (column > 0 && child.pos.x + child.width > _maxWidth) {
                                        // Push last child a row down since there is not enough space
                                        child.pos = k.vec2(_padding.x, pos.y + maxHeight + _spacing.y)
                                        pos.x = _padding.x + child.width + _spacing.x
                                        pos.y += maxHeight + _spacing.y
                                        column = 1
                                        maxHeight = child.height
                                    }
                                    else {
                                        // Just append to the right since we need at least one item per row
                                        maxHeight = Math.max(maxHeight, child.height)
                                        pos.x += child.width + _spacing.x
                                    }
                                })
                                break
                            }
                    }
                },
                get type() {
                    return _type
                },
                set type(type: LayoutType) {
                    _type = type
                    this.doLayout()
                },
                get padding(): Vec2 {
                    return _padding
                },
                set padding(padding: Vec2) {
                    _padding = k.vec2(padding)
                    this.doLayout()
                },
                get spacing(): Vec2 {
                    return _spacing
                },
                set spacing(spacing: Vec2) {
                    _spacing = k.vec2(spacing)
                    this.doLayout()
                },
                get columns(): number | undefined {
                    return _columns
                },
                set columns(columns: number) {
                    _columns = columns
                    this.doLayout()
                },
                get maxWidth(): number {
                    return _maxWidth
                },
                set maxWidth(maxWidth: number) {
                    _maxWidth = maxWidth
                    this.doLayout()
                }
            }
        }
    };
}
