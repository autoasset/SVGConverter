const SVGs_Input_Path = '../assets/SVGs/'
const PDFs_Output_Path = '../assets/PDFs/'
const XMLs_Output_Path = '../assets/XMLs/'
const XMLs_Options = {
    floatPrecision: 3, // 数值精度，默认为 2
    fillBlack: true, // 为无填充变成填充黑色，默认为 false
    xmlTag: true, // 添加 XML 文档声明标签，默认为 false
    tint: '#FF000000' // 在 vector 标签添加着色属性
};
const Iconfont_Output_Path = '../assets/Iconfont/'
const Iconfont_FontFamily = 'iconfont'

const fontCarrier = require('font-carrier')
const svg2vectordrawable = require('svg2vectordrawable');
const PDFDocument = require('pdfkit');
const SVGtoPDF = require('svg-to-pdfkit');

const fs = require('fs/promises')
const fsSync = require('fs')

async function svgFiles(path, callback) {
    var filenames = await fs.readdir(path)
    filenames = filenames.sort((a, b) => {
        return a.localeCompare(b);
    })

    for (let index = 0; index < filenames.length; index++) {
        const filename = filenames[index];
        const filePath = path + filename
        const data = await fs.readFile(filePath)
        callback({
            name: filename,
            index: index,
            path: filePath,
            data: data
        })
    }
}


(async () => {
    try {

        const font = createFont(Iconfont_FontFamily);
        const glyphs = []

        await fs.rmdir(PDFs_Output_Path, { recursive: true })
        await fs.mkdir(PDFs_Output_Path, { recursive: true })
        await fs.rmdir(Iconfont_Output_Path, { recursive: true })
        await fs.mkdir(Iconfont_Output_Path, { recursive: true })
        await fs.rmdir(XMLs_Output_Path, { recursive: true })
        await fs.mkdir(XMLs_Output_Path, { recursive: true })

        let iconFontHtml = `<style type="text/css">
        @font-face {
          font-family: 'iconfont';
          src: url('iconfont.eot'); /* IE9 */
          src: url('iconfont.eot?#iefix') format('embedded-opentype'), /* IE6-IE8 */
          url('iconfont.woff') format('woff2'),
          url('iconfont.woff') format('woff'), /* chrome、firefox */
          url('iconfont.ttf') format('truetype'), /* chrome、firefox、opera、Safari, Android, iOS 4.2+*/
          url('iconfont.svg#iconfont') format('svg'); /* iOS 4.1- */
        }
      
        .iconfont {
          font-family: "iconfont";
          font-size: 16px;
          font-style: normal;
        }
      </style>`

        await svgFiles(SVGs_Input_Path, async (file) => {
            const unicode = String.fromCharCode(0xe000 + file.index)
            
            font.setSvg(unicode, String(file.data))

            const unicodeHex = unicode.charCodeAt(0).toString(16)
            iconFontHtml += '\n'
            iconFontHtml = iconFontHtml + '<span class="iconfont">' + unicode + '</span>'

            glyphs.push({
                name: file.name
                    .replace(' ', '')
                    .replace('.svg', ''),
                font_class: Iconfont_FontFamily,
                unicode: unicodeHex
            })

            const xml = await svg2vectordrawable(file.data, XMLs_Options)
            await fs.writeFile(XMLs_Output_Path + file.name
                .replace(' ', '')
                .replace('.svg', '.xml'), xml)

            const doc = new PDFDocument()
            SVGtoPDF(doc, file.data.toString(), 0, 0);
            doc.pipe(fsSync.createWriteStream(PDFs_Output_Path + file.name
                .replace(' ', '')
                .replace('.svg', '.pdf')));
            doc.end();
        })

        font.output({
            path: Iconfont_Output_Path + Iconfont_FontFamily,
            types: ['ttf'],
        })

        await fs.writeFile(Iconfont_Output_Path + Iconfont_FontFamily + '.html', iconFontHtml)
        await fs.writeFile(Iconfont_Output_Path + Iconfont_FontFamily + '.json', JSON.stringify({
            font_family: Iconfont_FontFamily,
            glyphs: glyphs,
        }, null, 2))

    } catch (error) {
        console.log(error.message);
    }
})();


function createFont(fontFamily) {
    var font = fontCarrier.create();
    const ttfOptions = font.getFontface().options;
    ttfOptions.fontFamily = fontFamily;
    font.setFontface(ttfOptions);
    return font;
}

