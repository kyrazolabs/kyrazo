import { Plan } from '../../models/mongodb/Plan.model';
import { plansData } from '../data/plans';

export async function seedPlans() {
    console.log('Seeding Plans...');
    
    for (const data of plansData) {
        const existingPlan = await Plan.findOne({ slug: data.slug });
        
        if (existingPlan) {
            console.log(`Plan ${data.slug} already exists. Updating...`);
            await Plan.updateOne({ slug: data.slug }, { $set: data });
        } else {
            console.log(`Creating Plan ${data.slug}...`);
            const plan = new Plan(data);
            await plan.save();
        }
    }
    
    console.log('Plans seeded successfully!');
}
