const fs = require('fs-extra');
const path = require('path')


/**
	@abstract Class responsible for code extraction from file
 */
class CodeExtractor
{
	/**
		@abstract Constructor
	 */
	constructor(resourceFullPath)
	{
		this.defaults = {
			lang: "",
			src: "",
			begin: 1,
			end: 10,
			expandTabs: true,
			tabSize: 4,
			lineNumbers: false
		};
		
		this.resourcesPath = path.dirname(resourceFullPath);
	}
	
	/**
		@abstract Parse the code definition and store result object
	 */
	parse = function(codeDefinition)
	{
		this.codeDefinition = JSON.parse(codeDefinition);								// parses the definition string
		for (let [val, key] in this.defaults)
			this.codeDefinition[key] = val || this.defaults[key];						// then fills the missing entries with defaults
			
		this.modify_source();															// allow for alternative notation of source
			
		if (this.codeDefinition.src === '')
			throw new Error('Missing code source');
	}
	
	/**
		@abstract Read text file, extract information and return it
	 */
	get_text = function()
	{
		const path = this.resourcesPath + '/' + this.codeDefinition.src;
		const content = fs.readFileSync(path, 'utf-8');
		let lines = content.split('\n');
		lines = lines.slice(this.codeDefinition.begin - 1, this.codeDefinition.end);
		
		lines = lines.map(line => this.replace_tabs(line));
		
		let start = this.codeDefinition.begin;
		lines = lines.map(line => this.add_lineno(line, start++));
		
		return lines.join('\n');
	}
	
	/**
		@abstract Returns the language specification
	 */
	get_lang = function()
	{
		return this.codeDefinition.lang;
	}
	
	/**
		@abstract Styles the line numbers, e.g. encapsulates them with <pre> tags with proper styling
		
		This function does its work after rendering for the ready to be displayed html
	 */
	style_numbers = function(result)
	{
		return result.replace(																// for line numbers we need extra mark-up (pre with extra styles)
			/\<code\>.*?\<\/code\>/smg, 
			(match, offset, whole) =>
			{ 
				return match.replace(
					/(^|\<code\>)(\d\d\d\d)/smg, 											// do this with regex replacement
					`$1<pre class="hljs-lineno">$2</pre>`);
			});
	}
	
	/**
		@abstract Replace all tabs in a line, depending on codeDefinition
	 */
	replace_tabs = function(line)
	{
		const codeDefinition = this.codeDefinition;
		let idx = 0;
		
		const replace = function(char)
		{
			if (! codeDefinition.expandTabs || char != '\t')
			{
				idx ++;
				return char;
			}	
			
			const expandCount = codeDefinition.tabSize - idx % codeDefinition.tabSize;
			idx += expandCount;
			
			return ' '.repeat(expandCount); 
		};
		
		line = line.replace(/./g, char => replace(char));
		 
		return line;
	}

	/**
		@abstract Add line number at the begin of a line
	 */
	add_lineno = function(line, no)
	{
		if (! this.codeDefinition.lineNumbers)
			return line;
			
		return no.toString().padStart(4, '0') + '  ' + line;
	}
	
	/**
		@abstract Modify the source entry of code definition
	 */
	modify_source = function()
	{
		this.codeDefinition.src = this.codeDefinition.src.replace(/\[.*?(\..*?)\]\(\:\/(.*?)\)/, '$2$1');
		console.info(`Modified src definition: ${this.codeDefinition.src}`);
	}
}

module.exports = {
	default: CodeExtractor	
}

// export const default = CodeExtractor;
