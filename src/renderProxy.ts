const CodeExtractor = require('./codeExtractor');


export class RenderProxy
{
	/**
		@abstract Constructor
	 */
	constructor()
	{
		this.codeExtractor = new CodeExtractor.default();
	}

	indicator = function() : string
	{
		return this.codeExtractor.indicator();
	}
	
	/**
		@abstract Parse the code definition and store result object
	 */
	parse = function(resourcesPath: string, codeDefinition: any) : any
	{
		return this.codeExtractor.parse(resourcesPath, codeDefinition);
	}	
	
	/**
		@abstract Read text file, extract information and return it
	 */
	get_text = function() : string
	{
		return this.codeExtractor.get_text();
	}
	
	/**
		@abstract Returns the language specification
	 */
	get_lang = function() : string
	{
		return this.codeExtractor.get_lang();
	}
	
	/**
		@abstract Styles the line numbers, e.g. encapsulates them with <pre> tags with proper styling
		
		This function does its work after rendering for the ready to be displayed html
	 */
	post_process = function(result: string) : string
	{
		return this.codeExtractor.style_numbers(result);
	}
	
	codeExtractor: any;
}


module.exports = {
	default: RenderProxy	
}
