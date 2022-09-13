const RenderProxy = require('./renderProxy');
const fs = require('fs-extra');
const path = require('path');


module.exports = 
{
	default: function(context: any) : any 
	{
		console.info('Here in Plugin default (OUTER) function');
		
		const renderProxy = new RenderProxy.default();
		if (this.resourcePath === undefined) 
			this.resourcePath = null;
		
		/**
		 *	This is a default fence renderer
		 *	It will be invoked, if no other fence renderer can be acquired (according to demo code) 
		 */
		const defaultFenceRender = function(tokens: any, idx: any, options: any, env: any, self: any) : any 
		{
			console.info('Here in Plugin (defaultFenceRender) function');
			return self.renderToken(tokens, idx, options, env, self);
		};
		
		
		/**
		 *	@abstract Catches links (file appendices)
		 *
		 *	Extracts the required resource path and delegates to the original render function
		 */
		function catchLink(originalLinkOpenRender: any, ruleOptions: any, tokens: any[], idx: number) : any
		{
			let token = tokens[idx]
			// NOT REQUIRED, may disturb the client code
			// token['attrs'][0][1] = token['attrs'][0][1].replace(/_resources(.*?)\..*?$/, ':$1')		// TODO: required or trash??
			console.info(
				`Invoking Original LINK_OPEN render function at ` + 
				`${idx}: ${JSON.stringify(token)}`);
			
			let result = originalLinkOpenRender(tokens, idx);											// original must be invoked first
			
			console.info(
				`Original LINK_OPEN render function invoked at ` + 
				`${idx}: ${JSON.stringify(token)}`);
			console.info(`${ruleOptions.context.currentLinks.length} links`);
			
			if (!this.resourcePath)
			{
				const link = ruleOptions.context.currentLinks.find(										// after this we get full resource path!!
					(link: any) => link.resourceFullPath);
				if (link)
				{
					this.resourcePath = path.dirname(link.resourceFullPath);
					console.info(`currentLink set to: ${JSON.stringify(this.resourcePath)}`);
				}
				else
				{
					const link = ruleOptions.context.currentLinks.slice(-1)[0]
					console.info(`Last link is: ${JSON.stringify(link)}`)
				}
			}

			return result;
		}


		/**
		 *	@abstract The renderIt function
		 *
		 *	Will be invoked every time a code section needs to be rendered
		 *
		 */
		function renderIt(originalFenceRender: any, arguments: any) : any
		{
			// arguments: tokens: any, idx: any, options: any, env: any, self: any
			const indicator = renderProxy.indicator(); 												// 'codesection';

			let token = arguments[0][arguments[1]];
			if (token.info === indicator) 															// modification only for codesection fence
			{
				try
				{
					console.info(`Here in codesection fence, original content: ${token.content}`);
					
					if (!this.resourcePath)
					{
						this.resourcePath = alternateResourcePath();								// throws
					}
					
					renderProxy.parse(this.resourcePath, token.content);
					token.info = renderProxy.get_lang();											// the idea with this code is to modify the current fence token
					token.content = renderProxy.get_text();
					
					let result = originalFenceRender(...arguments);									// then invoke the original render function
					
					result = renderProxy.post_process(result);										// for line numbers we need extra mark-up (pre with extra styles)
					return result;
				}
				catch(e)
				{
					console.error(`${e}`);															// in error case display error in rendered pane as this can happen with JSON 
					return '<p style="color: red;">' + `${e}` + '</p>';
				}
			}
					
			return originalFenceRender(...arguments);												// then invoke the original render function
		}
		
		
		/**
		 *	@abstract Alternate method to get resource path
		 *
		 *	Probably no longer needed, because we have a long living 'resourcePath' variable
		 *	assigned to the outer function
		 */
		function alternateResourcePath() : any
		{
			let p = path.resolve('../resources') 													// workaround to get the note printed out (PDF)
			
			if (!fs.existsSync(p))
			{
				throw new Error(`No resource found: ${p}`);
			} 
			console.info(`Here in folder: ${p}`)													// working in developer mode only
			return p;									
		}
		

		return {
			plugin: function(markdownIt: any, ruleOptions: any)
			{	
				console.info('Here in Plugin (INNER) function');
		
				const pluginId = context.pluginId;
	
				let linkOpenRender = null;
				let fenceRender = null;

				if (!linkOpenRender)
				{
					linkOpenRender = markdownIt.renderer.rules.link_open;
					console.info('Original Link_Open Render stored');
					const originalLinkOpenRender = linkOpenRender;

					markdownIt.renderer.rules.link_open = 
						function(tokens: any[], idx: number) : any									// replacement for link_open rule 
					{
						return catchLink(originalLinkOpenRender, ruleOptions, tokens, idx);
					};
				}
			
				if (!fenceRender)
				{	
					fenceRender = markdownIt.renderer.rules.fence;
					console.info('Original Fence Render stored');
					const originalFenceRender = fenceRender || defaultFenceRender;

					markdownIt.renderer.rules.fence = function(...arguments: any) : any 			// replacement for FENCE rule
					{						
						return renderIt(originalFenceRender, arguments);
					};
				}
				
			},
			
			assets: function() : any {
				return [
					{ name: 'markdownIt.css' }
				];
			},
		}
	}
}
