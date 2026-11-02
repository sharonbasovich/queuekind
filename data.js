export const examples = [
 ['Food support', ['Can I pick up a grocery hamper this week?','We need canned food and rice for our family.','Where is the food pantry collection point?','I would like to arrange a meal delivery.','Are there vegetarian meals available today?','Our household needs help with groceries.','How do I collect a weekly food box?','Do you have fresh vegetables at the pantry?','I am asking about food parcels for children.','Can someone explain the meal pickup schedule?','Looking for donated groceries and pantry supplies.','We would appreciate a food hamper delivery.']],
 ['Transport', ['Could a volunteer drive me to the community centre?','I need a ride to my appointment on Tuesday.','Is there transport to the library workshop?','Can someone help arrange a bus pass?','I am looking for a driver for the morning trip.','Please help me get a ride home after the event.','Are volunteer drivers available this weekend?','We need accessible transport to the centre.','Can I book a lift for the afternoon?','How do I request a bus ticket for travel?','We need transport for a pickup across town.','I would like help arranging a return journey.']],
 ['Donations', ['I have coats and blankets to donate.','Where can I drop off unused school supplies?','Our office wants to donate spare laptops.','Can you accept a donation of winter clothing?','I would like to give some furniture to the charity.','We have books available for donation.','Who coordinates donated household equipment?','Can someone collect our spare kitchen items?','I have a box of toys to give away.','What donations are accepted at your collection centre?','We want to contribute unused notebooks and pencils.','Can we donate some warm jackets this week?']],
 ['Volunteering', ['How can I sign up as a volunteer?','I am available to help at the weekend fundraiser.','Where do new volunteers complete their training?','I would like to join the event setup team.','Do you have a shift for a new helper?','Can you tell me about volunteering opportunities?','I want to help organize the community workshop.','How do I change my volunteer shift?','Is there an orientation session for helpers?','Our group would like to volunteer together.','I can help sort donations on Saturday.','I want to register for volunteer induction.']]
].flatMap(([label,texts])=>texts.map(text=>({text,label})));
export const requests = [
 'Could I arrange a grocery hamper pickup for my family?',
 'I can volunteer for the Saturday setup shift.',
 'We have spare blankets and coats to donate.',
 'I need help getting to the centre and collecting food.',
 'The light in the corridor keeps flickering.',
 'Is there a volunteer driver for a return trip?'
];
