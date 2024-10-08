        function parseHeadingsWithContent(text) {
            // Regex to match h1-h6 tags and their content
            const headingRegex = /<h([1-6])>(.*?)<\/h[1-6]>/g;
            const blockRegex = /<(div|p|h[1-6]|ul|ol|li|section|article|aside|header|footer|main)>(.*?)<\/\1>/g; // Regex to match block-level content
            let match;
        
            // Stack to maintain hierarchy
            const stack = [];
            let root = [];
            
            // Function to create a node for heading
            function createNode(tag, content) {
                return {
                    tag: `h${tag}`,
                    content,
                    block_content: [],
                    childrens: []
                };
            }
        
            // Current position in the text for capturing block content
            let lastIndex = 0;
        
            // Iterate through all the heading tags in the content
            while ((match = headingRegex.exec(text)) !== null) {
                const level = parseInt(match[1], 10); // heading level (1 to 6)
                const content = match[2].trim(); // heading content
        
                // Capture any block content between the last heading and the current heading
                const currentBlockContent = text.slice(lastIndex, match.index).trim();
                if (currentBlockContent) {
                    const currentNode = stack[stack.length - 1];
                    if (currentNode) {
                        currentNode.block_content.push(currentBlockContent);
                    }
                }
                
                const node = createNode(level, content);
        
                // Manage stack to build the hierarchy
                if (stack.length === 0) {
                    // If stack is empty, push the node to the root
                    root.push(node);
                } else {
                    while (stack.length > 0 && parseInt(stack[stack.length - 1].tag[1], 10) >= level) {
                        stack.pop();
                    }
                    if (stack.length === 0) {
                        // If there's no higher-level heading, append to root
                        root.push(node);
                    } else {
                        // Append as child of the last item in the stack
                        stack[stack.length - 1].childrens.push(node);
                    }
                }
        
                // Push current node to the stack
                stack.push(node);
                lastIndex = headingRegex.lastIndex; // Update last index to current match index
            }
        
            // Capture any remaining block content after the last heading
            const remainingBlockContent = text.slice(lastIndex).trim();
            if (remainingBlockContent) {
                const currentNode = stack[stack.length - 1];
                if (currentNode) {
                    currentNode.block_content.push(remainingBlockContent);
                }
            }
        
            return root;
        }
        
        function render_block_content(blocks){
            blocks.forEach(i=>{
                book_contents.insertAdjacentHTML('beforeend', i);
            })
        }
        
        function render_data(items){
            if(items.length){
                items.forEach((i, index)=>{
                    book_contents.insertAdjacentHTML('beforeend', `
                        <${i['tag']} id="heading${i['tag']}${index}${i.content.replace(/\s+/g, '_')}"> 
                            ${i.content} 
                        </${i['tag']}>
                    `); 
                    
                    if(i.block_content.length){
                        render_block_content(i.block_content);
                    }
                    if(i.childrens.length){
                        render_data(i.childrens);
                    }
                })
            }
        }
        
        function scroll_to_content(href=""){
            event.preventDefault();
            let section = document.getElementById(href);
            if(section){
                // section.scrollIntoView({ behavior: 'smooth' });
                book_contents.scrollTo({ top: section.offsetTop - 50, behavior: 'smooth' });
            }
        }
        
        function render_index_data(items){
            var table_index = document.getElementById('table_index');
            if(items.length){
                items.forEach((i, index)=>{
                    table_index.insertAdjacentHTML('beforeend',`
                        <li class="text-left">
                            <a onclick="scroll_to_content('heading${i['tag']}${index}${i.content.replace(/\s+/g, '_')}')" href="heading${i['tag']}${index}${i.content.replace(/\s+/g, '_')}">
                                <${i['tag']}>
                                    <strong>
                                        ${i.content}
                                    </strong>
                                </${i['tag']}>
                            </a>
                        </li>
                    `); 
                    if(i.childrens.length){
                        render_index_data(i.childrens);
                    }
                })
            }
        }
        
        document.addEventListener('DOMContentLoaded', function() {
            axios.get("/api/contents")
                .then(res=>{
                    content_loader.remove();
                    
                    let content = res.data.book_description;
                    let blocks = parseHeadingsWithContent(content);
                    render_index_data(blocks);
                    render_data(blocks);
                    // console.log(JSON.stringify(blocks, null, 2));
                })
        });
