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
		let link_openRender = null;

		return {
			plugin: function(markdownIt, ruleOptions) {
				
				console.info('Here in Plugin function');
		
				const pluginId = context.pluginId;
				const indicator = 'codesection';
	
				if (fenceRender === null)	
					fenceRender = markdownIt.renderer.rules.fence;
				const originalRender = fenceRender || defaultRender;
			
				markdownIt.renderer.rules.fence = function(tokens, idx, options, env, self) {

					let token = tokens[idx];
					if (token.info === indicator) 																// modification only for codesection fence
					{
						try
						{
							console.info(`Here in codesection fence, original content: ${token.content}`);
							
							codeExtractor = new CodeExtractor.default();
							codeExtractor.parse(token.content);
							
							token.info = codeExtractor.get_lang();												// the idea with this code is to modify the current fence token
							token.content = codeExtractor.get_text();
						}
						catch(e)
						{
							console.error(`${e}`);
							return '<p style="color: red;">' + `${e}` + '</p>';
						}
					}
							
					return originalRender(tokens, idx, options, env, self);										// then invoke the original render function
				};

				if (link_openRender === null)	
					link_openRender = markdownIt.renderer.rules.link_open;
				
				markdownIt.renderer.rules.link_open = function(tokens, idx)
				{
					const token = tokens[idx];
					const href = getAttr(token.attrs, 'href', '');
					console.info(`Href: ${href}, Resources: ${JSON.stringify(ruleOptions.resources)}`);
					
					return link_openRender(tokens, idx);
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
