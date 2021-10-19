import joplin from 'api';
import { ContentScriptType } from 'api/types';
// const CodeExtractor = require('./codeExtractor');


joplin.plugins.register(
{
	onStart: async function() {
	
		const id = 'de.habelt.CodeSection';
	
		await joplin.commands.register({
			name: 'testCommand',
			label: 'My Test Command',
			execute: async (...args) => {
				alert('Got command "testCommand" with args: ' + JSON.stringify(args));
			},
		});

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
