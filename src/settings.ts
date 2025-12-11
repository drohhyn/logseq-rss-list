import { SettingSchemaDesc } from '@logseq/libs/dist/LSPlugin.user';

export const settingsSchema: SettingSchemaDesc[] = [
  {
    key: 'maxItems',
    type: 'number',
    default: 20,
    title: 'Maximum Items',
    description: 'Maximum number of RSS feed items to display'
  }
];