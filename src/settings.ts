import joplin from 'api';
import { SettingItemType, SettingItemSubType } from 'api/types';


/**
 * @abstract Supports Settings for the Code Section plugin.
 */
export class Settings
{
	/**
	 * @abstract Constructor
	 */
	constructor()
	{
	}
	
	/**
	 * @abstract Registers a series of settings used by the Plugin
	 */
	async register(id: string) : Promise<void>
	{
		const dataDir = await joplin.plugins.dataDir();

		await joplin.settings.registerSection(this.sectionName(), this.sectionLabel());
		await joplin.settings.registerSettings(this.descriptions());

		await joplin.settings.setValue('data_dir', dataDir);
		await joplin.settings.setValue('plugin_id', id);
		await this.setResourceDir();
	}
	
	/**
	 * @abstract The global resource dir is set as local (plugin) setting 
	 */
	async setResourceDir() : Promise<void>
	{
		const resourceDir = await joplin.settings.globalValue('resourceDir');
		await joplin.settings.setValue('resource_dir', resourceDir);
	}
		
	/**
	 * @abstract The section name to be used internally by Joplin for these settings
	 */
	sectionName() : string
	{
		return 'CodeSection.settings';
	}
	
	/**
	 * @abstract The section label name to be used by Joplin for these settings
	 */
	sectionLabel() : any
	{
		return { label: 'Code Section' };
	}
	
	/**
	 * @abstract Returns the descriptions of the settings how they are needed by Joplin.
	 * 			 This is done in 2 passes:
	 * 			 - the first pass returns settings which are always required
	 * 			 - the second pass returns all other settings including custom columns
	 * 
	 * @param firstPass - true for the first pass invocation
	 * @returns			- the descriptions for the settings
	 */
	descriptions() : any
	{
		return {
			'plugin_id':
			{
				section: this.sectionName(),
				public: false,
				label: 'Plugin Id',
				value: '',
				type: SettingItemType.String,
				description: 'The id of the plugin.'
			},
			'data_dir':
			{
				section: this.sectionName(),
				public: false,
				label: 'Data Dir',
				value: '',
				type: SettingItemType.String,
				description: 'The data dir of the plugin.'
			},
			'resource_dir':
			{
				section: this.sectionName(),
				public: false,
				label: 'Resource Dir',
				value: '',
				type: SettingItemType.String,
				description: 'The resource dir of Joplin.'
			}
		};
	}

	settings: any;
}

export const settings = new Settings();
