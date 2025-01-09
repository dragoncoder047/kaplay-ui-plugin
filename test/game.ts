import kaplay from "kaplay";
import uiPlugin from "../src/plugin";

const k = kaplay({
    plugins: [uiPlugin],
});

k.ui({});
