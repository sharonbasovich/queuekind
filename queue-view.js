/** A view only: stable original indices; never mutates decisions or training data. */
export function queueView(queue,filter='all'){
 const counts={all:queue.length,awaiting:0,reviewed:0,held:0},indices=[];
 queue.forEach((r,i)=>{const reviewed=!!r.reviewed,held=reviewed&&!!r.hold;counts[reviewed?'reviewed':'awaiting']++;if(held)counts.held++;if(filter==='all'||filter==='awaiting'&&!reviewed||filter==='reviewed'&&reviewed||filter==='held'&&held)indices.push(i);});
 return {counts,indices};
}
