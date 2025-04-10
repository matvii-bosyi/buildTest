const fs = require('fs-extra')
const path = require('path')
const handlebars = require('handlebars')

const viewsDir = path.join(__dirname, '../src/views/')
const buildDir = path.join(__dirname, '../build')
const pagesDir = path.join(viewsDir, 'pages')
const partialsDir = path.join(viewsDir, 'partials')
const scriptsDir = path.join(__dirname, '../src/scripts')
const scriptsDestDir = path.join(buildDir, 'scripts')

fs.emptyDirSync(buildDir)
fs.copySync(scriptsDir, scriptsDestDir)

const extractScripts = (templateContent) => {
	const match = templateContent.match(/{{!--\s*scripts:\s*(\[.*?\])\s*--}}/s)
	if (match) {
		try {
			return JSON.parse(match[1])
		} catch (error) {
			console.error('❌ Error parsing scripts:', error)
		}
	}
	return []
}

// console.log(extractScripts('{{!-- scripts: ["scripts/about.js"] --}}'));

const mainTemplateSource = fs.readFileSync(
	path.join(viewsDir, 'layouts/main.hbs'),
	'utf8'
)
const mainTemplate = handlebars.compile(mainTemplateSource)


function registerPartials(dir) {
	fs.readdirSync(dir).forEach(file => {
		const fullPath = path.join(dir, file)
		if (fs.statSync(fullPath).isDirectory()) {
			registerPartials(fullPath)
		} else if (path.extname(file) === '.hbs') {
			const partialName = path.basename(file, '.hbs')
			const partialContent = fs.readFileSync(fullPath, 'utf8')
			handlebars.registerPartial(partialName, partialContent)
			// console.log(`Registered partial: ${partialName} (from ${fullPath})`)
		}
	})
}

registerPartials(partialsDir)

fs.readdirSync(pagesDir).forEach(file => {
	const pageName = path.basename(file, '.hbs')
	const filePath = path.join(pagesDir, file)
	const pageContent = fs.readFileSync(filePath, 'utf8')
	const pageTemplate = handlebars.compile(pageContent)

	let scripts = extractScripts(pageContent)

	fs.readdirSync(partialsDir).forEach(partialFile => {
		const partialContent = fs.readFileSync(path.join(partialsDir, partialFile), 'utf8')
		const partialName = path.basename(partialFile, '.hbs')
		const usedInPage = pageContent.includes(`{{> ${partialName}}}`)
		// console.log(partialName, usedInPage);
		if (usedInPage) {
			const partialScript = extractScripts(partialContent)
			scripts = scripts.concat(partialScript)
		}	
	})
	
	scripts = [...new Set(scripts)]
	// console.log(scripts);
	

	const finalHtml = mainTemplate({
		title: pageName,
		body: pageTemplate({}),
		scripts
	})

	fs.writeFileSync(path.join(buildDir, `${pageName}.html`), finalHtml, 'utf8')
})

console.log('Build completed successfully!')