/*
 * KodeBlox Copyright 2018 Sayak Mukhopadhyay
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http: //www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as request from 'request-promise-native';
import * as moment from 'moment';
import { Message, RichEmbed } from 'discord.js';
import App from '../../../server';
import { Responses } from '../responseDict';
import { DB } from '../../../db/index';
import { Access } from './../access';
import { TickV4 } from "../../../interfaces/typings";
import { OptionsWithUrl, FullResponse } from 'request-promise-native';

export class Tick {
    db: DB;
    constructor() {
        this.db = App.db;
    }
    exec(message: Message, commandArguments: string): void {
        let argsArray: string[] = [];
        if (commandArguments.length !== 0) {
            argsArray = commandArguments.split(" ");
        }
        if (argsArray.length > 0) {
            let command = argsArray[0].toLowerCase();
            if (this[command]) {
                this[command](message, argsArray);
            } else {
                message.channel.send(Responses.getResponse(Responses.NOTACOMMAND));
            }
        } else {
            message.channel.send(Responses.getResponse(Responses.NOPARAMS));
        }
    }

    async get(message: Message, argsArray: string[]) {
        try {
            await Access.has(message.member, [Access.ADMIN, Access.BGS, Access.FORBIDDEN]);
            if (argsArray.length === 1) {
                let requestOptions: OptionsWithUrl = {
                    url: "https://elitebgs.kodeblox.com/api/ebgs/v4/ticks",
                    json: true,
                    resolveWithFullResponse: true
                }

                let response: FullResponse = await request.get(requestOptions);
                if (response.statusCode == 200) {
                    let body: TickV4 = response.body;
                    if (body.length === 0) {
                        message.channel.send(Responses.getResponse(Responses.FAIL));
                    } else {
                        let lastTick = body[0];
                        let embed = new RichEmbed();
                        embed.setTitle("Tick");
                        embed.setColor([255, 0, 255]);
                        let lastTickFormatted = moment(lastTick.time).utc().format('HH:mm');
                        embed.addField("Last Tick", lastTickFormatted + ' UTC');
                        embed.setTimestamp(new Date());
                        try {
                            await message.channel.send(embed);
                        } catch (err) {
                            console.log(err);
                        }
                    }
                } else {
                    console.log(response.statusMessage);
                }
            } else if (argsArray.length > 1) {
                message.channel.send(Responses.getResponse(Responses.TOOMANYPARAMS));
            } else {
                message.channel.send(Responses.getResponse(Responses.NOPARAMS));
            }
        } catch (err) {
            message.channel.send(Responses.getResponse(Responses.INSUFFICIENTPERMS));
        }
    }

    async detect(message: Message, argsArray: string[]) {
        try {
            await Access.has(message.member, [Access.ADMIN, Access.BGS, Access.FORBIDDEN]);
            if (argsArray.length === 1) {
                let guildId = message.guild.id;

                try {
                    let guild = await this.db.model.guild.findOneAndUpdate(
                        { guild_id: guildId },
                        {
                            updated_at: new Date(),
                            announce_tick: true
                        });
                    if (guild) {
                        message.channel.send(Responses.getResponse(Responses.SUCCESS));
                    } else {
                        try {
                            await message.channel.send(Responses.getResponse(Responses.FAIL));
                            message.channel.send("Your guild is not set yet");
                        } catch (err) {
                            console.log(err);
                        }
                    }
                } catch (err) {
                    message.channel.send(Responses.getResponse(Responses.FAIL));
                    console.log(err);
                }

            } else if (argsArray.length > 1) {
                message.channel.send(Responses.getResponse(Responses.TOOMANYPARAMS));
            } else {
                message.channel.send(Responses.getResponse(Responses.NOPARAMS));
            }
        } catch (err) {
            message.channel.send(Responses.getResponse(Responses.INSUFFICIENTPERMS));
        }
    }

    async stopdetect(message: Message, argsArray: string[]) {
        try {
            await Access.has(message.member, [Access.ADMIN, Access.BGS, Access.FORBIDDEN]);
            if (argsArray.length === 1) {
                let guildId = message.guild.id;

                try {
                    let guild = await this.db.model.guild.findOneAndUpdate(
                        { guild_id: guildId },
                        {
                            updated_at: new Date(),
                            announce_tick: false
                        });
                    if (guild) {
                        message.channel.send(Responses.getResponse(Responses.SUCCESS));
                    } else {
                        try {
                            await message.channel.send(Responses.getResponse(Responses.FAIL));
                            message.channel.send("Your guild is not set yet");
                        } catch (err) {
                            console.log(err);
                        }
                    }
                } catch (err) {
                    message.channel.send(Responses.getResponse(Responses.FAIL));
                    console.log(err);
                }
            } else {
                message.channel.send(Responses.getResponse(Responses.TOOMANYPARAMS));
            }
        } catch (err) {
            message.channel.send(Responses.getResponse(Responses.INSUFFICIENTPERMS));
        }
    }

    help() {
        return [
            'tick',
            'Gets the last tick or sets and removes the automatic announcement of the tick',
            'tick <get|detect|stopdetect>',
            [
                '`@BGSBot tick get`',
                '`@BGSBot tick detect`',
                '`@BGSBot tick stopdetect`'
            ]
        ];
    }
}