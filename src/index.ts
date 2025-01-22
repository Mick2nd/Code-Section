import joplin from 'api';
import { ContentScriptType, MenuItemLocation } from 'api/types';
import { settings } from './settings';
const path = require('path');


/**
	@abstract Function or lambda to execute menu command
	
	This command inserts a Code Section Template
 */
const insertCodeSectionCommand = async () => 
{ 
	try
	{
		const text = `
\`\`\`codesection
{
"lang": "",
"src": "",
"begin": 1,
"end": -1,
"lineNumbers": true,
"expandTabs": false,
"tabSize": 4,
"scale": "100%",
"spacing": "130%",
"height": "auto" 
}
\`\`\`
`
		await joplin.commands.execute('insertText', text);
	}
	catch(e)
	{
		console.error('Exception in command: ' + e);
	}
	finally
	{
		console.info('Finally'); 
	} 
}


joplin.plugins.register(
{
	onStart: async function() {
	
		const id = 'de.habelt.CodeSection';

		await settings.register(id);							// a few ever needed settings
	
		await joplin.commands.register({
			name: 'insertCodeSectionCommand',
			label: 'Insert Code Section Template',
			execute: insertCodeSectionCommand
		});
	
		await joplin.views.menuItems.create(
			'mnuInsertCodeSection', 
			'insertCodeSectionCommand',
			MenuItemLocation.EditorContextMenu);
		
		const dataDir = await joplin.plugins.dataDir();
		console.info(`Data Dir is : ${dataDir}`);
		const resourcesDir = path.resolve(`${dataDir}/../../resources`);
		console.info(`Resource Dir is : ${resourcesDir}`);

		await joplin.contentScripts.register(
			ContentScriptType.MarkdownItPlugin,
			`${id}`,																// concatenate id with resources dir -> simpler way
			'./markdownIt.js'
		);

		await joplin.contentScripts.onMessage(id, async function(message: any) {
			if (message  !== 'queryDataDirectory')
				return;
			
			return await joplin.plugins.dataDir();
		});
	},
});
