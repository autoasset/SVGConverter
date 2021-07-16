var fontCarrier = require('font-carrier')
var fs = require('fs')

async function main(path, fontFamily) {
    var font = fontCarrier.create()
    let files = await fs.readdirSync(path)
    files = await files.sort((a, b) => {
       return a.localeCompare(b);
    })
    .map((filename, index) => {
        const svg = fs.readFileSync(path + '/' + filename).toString()
        const unicode = String.fromCharCode(0xe000 + index)
        font.setSvg(unicode, svg)
        return {
            filename: filename,
            unicode: unicode.charCodeAt(0).toString(16)
        }
    })

    const options = font.getFontface().options
    options.fontFamily = fontFamily
    font.setFontface(options)

    font.output({
        path: './iconfont/' + fontFamily,
        types: ['ttf', 'svg'],
    })
    console.log(JSON.stringify(files))
}


(async () => {
    try {
        await main('./svgs', 'iconfont');
    } catch (e) {
        console.log(e);
    }
})();
