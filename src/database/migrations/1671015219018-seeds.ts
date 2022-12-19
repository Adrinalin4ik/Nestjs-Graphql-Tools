import * as config from 'config';
import { MigrationInterface, QueryRunner } from "typeorm";
import { DescriptionChecklistItem } from "../../entities/description/description-types/description-checklist/check-item/description-checklist-item.entity";
import { DescriptionChecklist } from "../../entities/description/description-types/description-checklist/description-checklist.entity";
import { DescriptionText } from "../../entities/description/description-types/description-text/description-text.entity";
import { DescriptionType } from "../../entities/description/description.dto";
import { Description } from "../../entities/description/description.entity";
import { Task } from "../../entities/task/task.entity";
import { User } from "../../entities/user/user.entity";
import { IDBSettings } from "../settings.types";

const settings: IDBSettings = config.DB_SETTINGS;

export class seeds1671015219018 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.connection.synchronize();
        // seed users
        const userSec = sequense(0, 30);
        const numberOfTasksForEachUser = 3;
        const users: User[] = [];
        const tasks: Task[] = [];

        for (const i of userSec) {
            const created_at = new Date(new Date().getTime() - i*24*60*60*1000);
            const user = await queryRunner.connection.getRepository(User).save({
                age: 20 + i,
                email: `user+${i}@google.com`,
                fname: `User ${i}`,
                lname: `${generateRandomString()}`,
                mname: `MiddleName`,
                identification_number: i + 100000,
                created_at,
                phone: i%2 == 0 ? `00000000${i}` : null,
            });
            users.push(user);

            for (let t=1; t<=numberOfTasksForEachUser; t++) {
                const task = await queryRunner.connection.getRepository(Task).save({
                    assignee: user,
                    title: `Task ${i}-${t}`,
                    description: `Task description ${i}-${t}`,
                    created_at,
                    story_points: i%2 == 0 ? i*t : null,
                    type_id: 1,
                    status: t,
                });

                for(let d = 1; d<3; d++) {
                    const description_text = await queryRunner.connection.getRepository(DescriptionText).save({
                        text: `Description ${d} for task with id ${task.id}`,
                    });
                    await queryRunner.connection.getRepository(Description).save({
                        description_id: description_text.id,
                        description_type: DescriptionType.Text,
                        task
                    });

                    const description_checklist = await queryRunner.connection.getRepository(DescriptionChecklist).save({
                        title: `Checklist ${d} for task with id ${task.id}`,
                    });

                    await queryRunner.connection.getRepository(Description).save({
                        description_id: description_text.id,
                        description_type: DescriptionType.Text,
                        task
                    });

                    for (let ci=0; ci <3; ci++) {
                        const checklist_item = await queryRunner.connection.getRepository(DescriptionChecklistItem).save({
                            checklist: description_checklist,
                            label: `Checklist item ${ci} for checklist with id ${description_checklist.id}`

                        })
                    }
                }


                
                tasks.push(task);
            }
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }
}

const sequense = (min, max) => {
    const res = [];
    for (let i = min; i<=max; i++) {
        res.push(i);
    }

    return res;
}

const random = (min: number, max: number) => {
    return Math.round((Math.random() + min) * max);
}

const generateRandomString = () => {
    return Math.floor(Math.random() * 1e6).toString(16);
}
