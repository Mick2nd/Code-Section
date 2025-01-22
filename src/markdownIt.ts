const RenderProxy = require('./renderProxy');
const fs = require('fs-extra');
const path = require('path');

module.exports = 
{
	default: function(context: any) : any 
	{
		const pluginId = context.pluginId;
		console.info(`${pluginId} : Here in Plugin default (OUTER) function`);
		
		const renderProxy = new RenderProxy.default();
		
		/**
		 *	This is a default fence renderer
		 *	It will be invoked, if no other fence renderer can be acquired (according to demo code) 
		 */
		const defaultFenceRender = function(tokens: any, idx: any, options: any, env: any, self: any) : any 
		{
			console.info(`${pluginId} : Here in Plugin (defaultFenceRender) function`);
			return self.renderToken(tokens, idx, options, env, self);
		};

		
		/**
		 *	@abstract The renderIt function
		 *
		 *	Will be invoked every time a code section needs to be rendered
		 */
		function renderIt(originalFenceRender: any, ruleOptions: any, arguments: any) : any
		{
			// arguments: tokens: any, idx: any, options: any, env: any, self: any
			const indicator = renderProxy.indicator(); 												// 'codesection';

			let token = arguments[0][arguments[1]];
			if (token.info === indicator) 															// modification only for codesection fence
			{
				try
				{
					console.debug(`${pluginId} : %O`, ruleOptions);
					const resourcePath = ruleOptions.settingValue('resource_dir');
					
					renderProxy.parse(resourcePath, token.content);
					token.info = renderProxy.get_lang();											// the idea with this code is to modify the current fence token
					token.content = renderProxy.get_text();
					
					console.info(
						`${pluginId} : Here in codesection fence, original content: %O`, 
						renderProxy.get_object());
					
					let result = originalFenceRender(...arguments);									// then invoke the original render function
					
					result = renderProxy.post_process(result);										// for line numbers we need extra mark-up (pre with extra styles)
					return result;
				}
				catch(e)
				{
					console.error(`${pluginId} : ${e}`);											// in error case display error in rendered pane as this can happen with JSON 
					return '<p style="color: red;">' + `${e}` + '</p>';
				}
			}
					
			return originalFenceRender(...arguments);												// then invoke the original render function
		}
		
		return {
			plugin: async function(markdownIt: any, ruleOptions: any)
			{	
				console.info(`${pluginId} : Here in Plugin (INNER) function`);
		
				const fenceRender = markdownIt.renderer.rules.fence;
				console.info(`${pluginId} : Original Fence Render stored`);
				const originalFenceRender = fenceRender || defaultFenceRender;

				markdownIt.renderer.rules.fence = function(...arguments: any) : any 				// replacement for FENCE rule
				{						
					return renderIt(originalFenceRender, ruleOptions, arguments);
				};				
			},
			
			assets: function() : any {
				return [
					{ name: 'markdownIt.css' }
				];
			},
		}
	}
}
