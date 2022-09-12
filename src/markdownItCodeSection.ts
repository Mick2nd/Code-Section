const CodeExtractor = require('./codeExtractor');
const fs = require('fs-extra');
const path = require('path');


const getAttr = function(attrs: any, name: string, defaultValue: any = null) : any 
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
	default: function(context: any) : any 
	{
		console.info('Here in Plugin default (OUTER) function');
		
		const defaultFenceRender = function(tokens: any, idx: any, options: any, env: any, self:any) : any 
		{
			console.info('Here in Plugin (defaultFenceRender) function');
			return self.renderToken(tokens, idx, options, env, self);
		};

		return {
			plugin: function(markdownIt: any, ruleOptions: any)
			{	
				console.info('Here in Plugin (INNER) function');
		
				const pluginId = context.pluginId;
				const indicator = 'codesection';
	
				let linkOpenRender = null;
				let fenceRender = null;
				let currentLink = null;

				if (!linkOpenRender)
				{
					linkOpenRender = markdownIt.renderer.rules.link_open;
					console.info('Original Link_Open Render stored');
					const originalLinkOpenRender = linkOpenRender;

					markdownIt.renderer.rules.link_open = 
						function(tokens: any[], idx: number) : any													// replacement for link_open rule 
					{
						let token = tokens[idx]
						token['attrs'][0][1] = token['attrs'][0][1].replace(/_resources(.*?)\..*?$/, ':$1')
						console.info(
							`Invoking Original LINK_OPEN render function at ` + 
							`${idx}: ${JSON.stringify(token)}`);
						let result = originalLinkOpenRender(tokens, idx);											// original must be invoked first
						console.info(
							`Original LINK_OPEN render function invoked at ` + 
							`${idx}: ${JSON.stringify(token)}`);
						console.info(`${ruleOptions.context.currentLinks.length} links`);
						
						if (!currentLink)
						{
							currentLink = ruleOptions.context.currentLinks.find(									// after this we get full resource path!!
								(link: any) => link.resourceFullPath);
							if (currentLink)
							{
								console.info(`currentLink set to: ${JSON.stringify(currentLink)}`);
							}
							else
							{
								const link = ruleOptions.context.currentLinks.slice(-1)[0]
								console.info(`Last link is: ${JSON.stringify(link)}`)
							}
						}
	
						return result;
					};
				}

			
				if (!fenceRender)
				{	
					fenceRender = markdownIt.renderer.rules.fence;
					console.info('Original Fence Render stored');
					const originalFenceRender = fenceRender || defaultFenceRender;

					markdownIt.renderer.rules.fence = 
						function(tokens: any, idx: any, options: any, env: any, self: any) : any 					// replacement for FENCE rule
					{
						let token = tokens[idx];
						if (token.info === indicator) 																// modification only for codesection fence
						{
							try
							{
								console.info(`Here in codesection fence, original content: ${token.content}`);
								
								if (!currentLink)
								{
									let p = path.resolve('../resources') 											// workaround to get the note printed out (PDF)
									console.info(`Here in folder: ${p}`)											// working in developer mode only
									
									if (!fs.existsSync(p))
									{
										throw new Error('No resource found');
									} 
									currentLink = { resourceFullPath: p + '/dummy' }									
								}
								
								let codeExtractor = new CodeExtractor.default(currentLink.resourceFullPath);
								codeExtractor.parse(token.content);
								
								token.info = codeExtractor.get_lang();												// the idea with this code is to modify the current fence token
								token.content = codeExtractor.get_text();
								
								let result = originalFenceRender(tokens, idx, options, env, self);					// then invoke the original render function
								result = codeExtractor.style_numbers(result);										// for line numbers we need extra mark-up (pre with extra styles)
								return result;
							}
							catch(e)
							{
								console.error(`${e}`);																// in error case display error in rendered pane as this can happen with JSON 
								return '<p style="color: red;">' + `${e}` + '</p>';
							}
						}
								
						return originalFenceRender(tokens, idx, options, env, self);								// then invoke the original render function
					};
				}
				
			},
			
			assets: function() : any {
				return [
					{ name: 'markdownItCodeSection.css' }
				];
			},
		}
	}
}
