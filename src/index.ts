import joplin from 'api';
import { ContentScriptType, MenuItemLocation } from 'api/types';
// const CodeExtractor = require('./codeExtractor');


/**
	@abstract Function or lambda to execute menu command
	
	This command inserts a Code Section Template
 */
const insert_code_section_command = async () => 
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
	
		await joplin.commands.register({
			name: 'insertCodeSectionCommand',
			label: 'Insert Code Section Template',
			execute: insert_code_section_command
		});
	
		await joplin.views.menuItems.create(
			'mnuInsertCodeSection', 
			'insertCodeSectionCommand',
			MenuItemLocation.EditorContextMenu);

		await joplin.commands.register({
			name: 'testCommandNoArgs',
			label: 'My Test Command (no args)',
			execute: async () => {
				alert('Got command "testCommandNoArgs"');
			},
		});

		await joplin.contentScripts.register(
			ContentScriptType.MarkdownItPlugin,
			id,
			'./markdownItCodeSection.js'
		);

		await joplin.contentScripts.onMessage(id, async function(message: any) {
			if (message  !== 'queryDataDirectory')
				return;
			
			return await joplin.plugins.dataDir();
		});
		
		// CodeExtractor.setDataDir(await joplin.plugins.dataDir());
	},
});
