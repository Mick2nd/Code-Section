const CodeExtractor = require('./codeExtractor');


const getAttr = function(attrs, name, defaultValue = null) 
{
	for (let i = 0; i < attrs.length; i++) 
	{
		if (attrs[i][0] === name)
			return attrs[i].length > 1 ? attrs[i][1] : null;
	}
	return defaultValue;
}

	
module.exports = 
{
	default: function(context) 
	{
		console.info('Here returning Plugin function');
		
		const defaultRender = function(tokens, idx, options, env, self) {
			return self.renderToken(tokens, idx, options, env, self);
		};
		let fenceRender = null;
		let linkOpenRender = null;
		let currentLink = null;

		return {
			plugin: function(markdownIt, ruleOptions) {
				
				console.info('Here in Plugin function');
		
				const pluginId = context.pluginId;
				const indicator = 'codesection';
	
				if (linkOpenRender === null)
					linkOpenRender = markdownIt.renderer.rules.link_open;
				if (fenceRender === null)	
					fenceRender = markdownIt.renderer.rules.fence;
				const originalRender = fenceRender || defaultRender;

				markdownIt.renderer.rules.link_open = function(tokens, idx)										// replacement for link_open rule 
				{
					let result = linkOpenRender(tokens, idx);													// original must be invoked first
					
					if (!currentLink)
						currentLink = ruleOptions.context.currentLinks.find(									// after this we get full resource path!!
							link => link.resourceFullPath !== null);

					return result;
				};
			
				markdownIt.renderer.rules.fence = function(tokens, idx, options, env, self) 					// replacement for FENCE rule
				{
					let token = tokens[idx];
					if (token.info === indicator) 																// modification only for codesection fence
					{
						try
						{
							console.info(`Here in codesection fence, original content: ${token.content}`);
							
							if (!currentLink)
							{
								throw new Error('No resource found');
							}
							
							codeExtractor = new CodeExtractor.default(currentLink.resourceFullPath);
							codeExtractor.parse(token.content);
							
							token.info = codeExtractor.get_lang();												// the idea with this code is to modify the current fence token
							token.content = codeExtractor.get_text();
							
							let result = originalRender(tokens, idx, options, env, self);						// then invoke the original render function
							result = codeExtractor.style_numbers(result);										// for line numbers we need extra mark-up (pre with extra styles)
							return result;
						}
						catch(e)
						{
							console.error(`${e}`);																// in error case display error in rendered pane as this can happen with JSON 
							return '<p style="color: red;">' + `${e}` + '</p>';
						}
					}
							
					return originalRender(tokens, idx, options, env, self);										// then invoke the original render function
				};
			},
			
			assets: function() {
				return [
					{ name: 'markdownItCodeSection.css' }
				];
			},
		}
	}
}
