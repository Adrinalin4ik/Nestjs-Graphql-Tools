"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seeds1671015219018 = void 0;
const config = require("config");
const description_checklist_item_entity_1 = require("../../entities/description/description-types/description-checklist/check-item/description-checklist-item.entity");
const description_checklist_entity_1 = require("../../entities/description/description-types/description-checklist/description-checklist.entity");
const description_text_entity_1 = require("../../entities/description/description-types/description-text/description-text.entity");
const description_dto_1 = require("../../entities/description/description.dto");
const description_entity_1 = require("../../entities/description/description.entity");
const task_entity_1 = require("../../entities/task/task.entity");
const user_entity_1 = require("../../entities/user/user.entity");
const settings = config.DB_SETTINGS;
class seeds1671015219018 {
    async up(queryRunner) {
        await queryRunner.connection.synchronize();
        const userSec = sequense(0, 30);
        const numberOfTasksForEachUser = 3;
        const users = [];
        const tasks = [];
        for (const i of userSec) {
            const created_at = new Date(new Date().getTime() - i * 24 * 60 * 60 * 1000);
            const user = await queryRunner.connection.getRepository(user_entity_1.User).save({
                age: 20 + i,
                email: `user+${i}@google.com`,
                fname: `User ${i}`,
                lname: `${generateRandomString()}`,
                mname: `MiddleName`,
                identification_number: i + 100000,
                created_at,
                phone: Math.random() > 0.5 ? `00000000${i}` : null,
            });
            users.push(user);
            for (let t = 1; t <= numberOfTasksForEachUser; t++) {
                const task = await queryRunner.connection.getRepository(task_entity_1.Task).save({
                    assignee: user,
                    title: `Task ${i}-${t}`,
                    description: `Task description ${i}-${t}`,
                    created_at,
                    story_points: Math.random() > 0.5 ? i * t : null,
                    type_id: 1,
                    status: t,
                });
                for (let d = 1; d < 3; d++) {
                    const description_text = await queryRunner.connection.getRepository(description_text_entity_1.DescriptionText).save({
                        text: `Description ${d} for task with id ${task.id}`,
                    });
                    await queryRunner.connection.getRepository(description_entity_1.Description).save({
                        description_id: description_text.id,
                        description_type: description_dto_1.DescriptionType.Text,
                        task
                    });
                    const description_checklist = await queryRunner.connection.getRepository(description_checklist_entity_1.DescriptionChecklist).save({
                        title: `Checklist ${d} for task with id ${task.id}`,
                    });
                    await queryRunner.connection.getRepository(description_entity_1.Description).save({
                        description_id: description_text.id,
                        description_type: description_dto_1.DescriptionType.Text,
                        task
                    });
                    for (let ci = 0; ci < 3; ci++) {
                        const checklist_item = await queryRunner.connection.getRepository(description_checklist_item_entity_1.DescriptionChecklistItem).save({
                            checklist: description_checklist,
                            label: `Checklist item ${ci} for checklist with id ${description_checklist.id}`
                        });
                    }
                }
                tasks.push(task);
            }
        }
    }
    async down(queryRunner) {
    }
}
exports.seeds1671015219018 = seeds1671015219018;
const sequense = (min, max) => {
    const res = [];
    for (let i = min; i <= max; i++) {
        res.push(i);
    }
    return res;
};
const random = (min, max) => {
    return Math.round((Math.random() + min) * max);
};
const generateRandomString = () => {
    return Math.floor(Math.random() * 1e6).toString(16);
};
//# sourceMappingURL=1671015219018-seeds.js.map