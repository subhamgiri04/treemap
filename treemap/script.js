class TreeMap {
    static rootNode;
    static activeNode = null;
    constructor(id, name = '', size = 0, cdate = 0) {
        this.__id = id;
        this.name = name;
        this.size = size;
        this.cdate = cdate;
        this.descendants = [];
        this.parent = null;
        this.root = null;
    }

    get child() {
        return this.descendants;
    }

    set child(node) {
        this.descendants.push(node);
        if (node) {
            node.parent = this;
        }
    }
};

TreeMap.prototype.add = function (id, name = '', size = 0, cdate = 0) {
    const newNode = new TreeMap(id, name, size, cdate),
        found = this.findNodeDfs(id, true);
    if (found) { // duplicated: value already exists on the tree
        console.warn(`Document with id:${id} already exists!!`);
        return false;
    } else {
        this.child = newNode;
    }

    newNode.root = this.root ? this.root : this;

    return newNode;
}

TreeMap.prototype.findNodeDfs = function (id, fromRoot = false) {
    var parent = null, 
        found = null,
        node = fromRoot && this.root ? this.root : this,
        i = 0;
    // dfs
    if (node.__id === id) {
        found = node;
    } else {
        if (!parent) parent = node;
        node = parent.descendants[i];
        while (node) {
            found = node.findNodeDfs(id);
            if (found) break;
            node = parent.descendants[++i];
        }
    }
    return found;
}

TreeMap.prototype.setRoot = function (node) {
    this.root = node;
    this.descendants.forEach(descendant => {
        descendant.setRoot(node);
    })
}

TreeMap.prototype.attachTo = function (node) {
    node.child = this;
    this.setRoot(node.root ? node.root : node);
}

TreeMap.prototype.detach = function () {
    this.parent = null;
    this.root = null;
    this.descendants.forEach(descendant => {
        descendant.setRoot(this);
    })
    TreeMap.rootNodes.push(this);
}

TreeMap.prototype.remove = function (id, attachToParent = false) {
    const nodeToRemove = this.findNodeDfs(id),
        parent = nodeToRemove.parent,
        descendants = nodeToRemove.descendants;
    if (!nodeToRemove) {
        console.warn(`No document with id:${id} is found!!`);
        return false;
    }

    if (attachToParent) {
        if (parent) {
            descendants.forEach(descendant => {
                parent.child = descendant;
            });
        } else {
            console.warn(`No parent is there for document with id:${id}`)
        }
    }

    if (parent) {
        parent.descendants.splice(parent.descendants.indexOf(nodeToRemove), 1);
    } else {
        nodeToRemove.descendants = [];
        delete nodeToRemove.value;
    }

    return true;
}

//////////////////////////////////////////////////////////////////////////////////////////////

// A function to create unique id in base 36 (format: timestamp(8)-random(4)-random(4)-random(4))

function uniqueId(length) {
    const MAX_LEN = 20;
    length = parseInt(length);

    if (!length || length == null || length == NaN) length = MAX_LEN;

    let uid = '',
        timmy = Date.now().toString(36),
        randy = Math.floor(Math.random() * Math.pow(36, 12)).toString(36).padStart(12, '0');
    if (length < timmy.length) {
        uid = randy.slice(-length);
    } else {
        length = length - timmy.length;
        while (length >= 4) {
            uid += `-${randy.slice(-4)}`;
            randy = randy.slice(0, -4);
            length = length - 4;
        }
        if (length > 0) uid = `-${randy.slice(-length)}${uid}`;
        uid = `${timmy}${uid}`;
    }
    return uid;
}

// Just to convert string(number) in base 36 (or some other) to base 10.

String.prototype.toDec = function (currBase) {
    var i = this.length - 1,
        result = 0;
    while (i >= 0) {
        result += ((this.charCodeAt(i) > 96) ? (this.charCodeAt(i) - 87) : this.charAt(i)) * Math.pow(currBase, this.length - (i + 1));
        i--;
    }
    return result;
}

//////////////////////////////////////////////////////////////////////////////////////////////

// A function to sort items(nodes) by name property.
// Logic is simple, 
// 1. take a temporary array.
// 2. now insert one item.
// 3. for further items, check whether that current item(node) has a name greater (in alpha. seq.) than the last item of the temporary array.
// 4. if it's bigger, insert it after that element of temprary array, or if it's small, try the same process with previous element of that temporary array.
// 5. now return that temporary array.

function sortByName() {
    var children = TreeMap.activeNode.descendants,
        tempArr = [];

    children.forEach(child => {
        if (tempArr.length > 0) {
            let currName = child.name,
                i = tempArr.length - 1;
            while (i >= 0) {
                // console.log(i);
                let lastName = tempArr[i].name,
                    tArr = [currName, lastName].sort(),
                    ci = tArr.indexOf(currName),
                    li = tempArr.indexOf(lastName);
                if (ci > li) {
                    tempArr.splice(i + 1, 0, child);
                    break;
                } else {
                    i--;
                }
            }
            if (i < 0) {
                tempArr.unshift(child);
            }
        } else {
            tempArr.push(child);
        }
    })

    return tempArr;
}

// A function to sort items(nodes) by size property.
// Logic is same as with sortByName(), 

function sortBySize() {
    var children = TreeMap.activeNode.descendants,
        tempArr = [];

    children.forEach(child => {
        if (tempArr.length > 0) {
            let currSize = child.size,
                i = tempArr.length - 1;
            while (i >= 0) {
                // console.log(i);
                let lastSize = tempArr[i].size;
                if (currSize > lastSize) {
                    tempArr.splice(i + 1, 0, child);
                    break;
                } else if (currSize < lastSize) {
                    i--;
                } else {
                    if ((!tempArr[i - 1]) || (currSize > tempArr[i - 1].size)) {
                        if (child.cdate > tempArr[i].cdate) {
                            tempArr.splice(i + 1, 0, child);
                            break;
                        } else {
                            tempArr.splice(i, 0, child);
                            break;
                        }
                    } else {
                        i--;
                    }
                }
            }
            if (i < 0) {
                tempArr.unshift(child);
            }
        } else {
            tempArr.push(child);
        }
    })
    return tempArr;
}

// A function to sort items(nodes) by date created(cdate) property.
// Logic is same as with sortByName(), 

function sortByCDate() {
    var children = TreeMap.activeNode.descendants,
        tempArr = [];

    children.forEach(child => {
        if (tempArr.length > 0) {
            let currDate = child.cdate,
                i = tempArr.length - 1;
            while (i >= 0) {
                // console.log(i);
                let lastDate = tempArr[i].cdate;
                if (currDate > lastDate) {
                    tempArr.splice(i + 1, 0, child);
                    break;
                } else {
                    i--;
                }
            }
            if (i < 0) {
                tempArr.unshift(child);
            }
        } else {
            tempArr.push(child);
        }
    })

    return tempArr;
}

//////////////////////////////////////////////////////////////////////////////////////////////

// A function to create html templates and fill in given information (as provided in parameters of this function like iName, iSize, etc.).

/* `<li class="item">
<details class="is-expandable">
  <summary class="item-title">about</summary>
  <section include="aboutv-O-2.html"></section>
</details>
</li>` */

function createNewEntry(iName = '', iSize = 0, iCDate, parent) {
    var root = document.getElementById('root').children[0],
        // cBtn = document.getElementById('createBtn'),
        itemNo = root.children.length + 1;

    var item = document.createElement('li');
    item.className = "item";
    item.id = `item-${itemNo}`;
    item.dataset.itemName = iName;
    item.dataset.itemCDate = iCDate;
    item.dataset.itemSize = iSize;
    item.ondblclick = function () {
        switchTo(`c:${itemNo-1}`);
    }
    var itemDetail = document.createElement('details');

    var summ = document.createElement('summary');
    summ.className = "item-title";
    summ.innerText = iName;

    var sect = document.createElement('section');

    itemDetail.append(summ, sect);

    item.append(itemDetail);

    if (parent) {
        parent.append(item);
    } else {
        root.append(item);
    }

    return item;
}

//////////////////////////////////////////////////////////////////////////////////////////////

// A function to process items (for a given array of TreeMap Nodes, it creates an HTML element corresponding to each node in the given array, and all descendants of each element(TreeMap Node) of the given array).

function processItems(arr = [], removeAll = true, parent) {
    if (!Array.isArray(arr)) {
        return;
    }

    if (removeAll) {
        document.getElementById('root').querySelectorAll('.item').forEach(item => {
            item.remove();
        })
    }

    arr.forEach(item => {
        let iName = item.name,
            iSize = item.size,
            iCDate = item.cdate,
            newItem;

        newItem = createNewEntry(iName, iSize, iCDate, parent);

        processItems(item.descendants, false, newItem.children[0].children[1]);
    })

}

// It basically zoom outs, or zoom ins on a particular item 

function switchTo(n = 'p') {
    var newActive;
    if (n[0] == 'c') {
        let i = parseInt(n.slice(n.indexOf(":") + 1));
        if (!isNaN(i)) {
            newActive = TreeMap.activeNode.descendants[i];
        } else return;
    } else {
        newActive = TreeMap.activeNode.parent ? TreeMap.activeNode.parent : TreeMap.activeNode;
    }

    if (!newActive) {
        return;
    }

    TreeMap.activeNode = newActive;

    processItems(TreeMap.activeNode.descendants);
}

//////////////////////////////////////////////////////////////////////////////////////////////

const sortSel = document.getElementById("sortSel"),
    sortRev = document.getElementById('sortRev');

// This function is for changing sorting of items according to a given way.(like byName or bySize, etc.)

function changeSorting(sortBy = 'n', rev = false) {
    var sortedArray;

    if (sortBy == "n") {
        sortedArray = sortByName();
    } else if (sortBy == "s") {
        sortedArray = sortBySize();
    } else if (sortBy == "d") {
        sortedArray = sortByCDate();
    }

    if (rev) {
        sortedArray = sortedArray.reverse();
    }

    processItems(sortedArray);
}

// Some events on html elements to add user interactivity

sortSel.onchange = function () {
    changeSorting(this.value);
}

sortRev.onchange = function () {
    changeSorting(sortSel.value, this.checked);
}

document.getElementById('createBtn').onclick = function () {
    var uid = uniqueId(20),
        newNode,
        root = document.getElementById('root').children[0],
        iName = `Item ${root.children.length + 1}`,
        iCDate = uid.substr(0, uid.indexOf('-')).toDec(36),
        iSize = parseInt(Math.random() * 100);

    if (TreeMap.activeNode) {
        newNode = TreeMap.activeNode.add(uid, iName, iSize, iCDate);
    } else {
        return;
    }

    createNewEntry(iName, iSize, iCDate);
}

document.getElementById('back').onclick = function () {
    switchTo("p");
}

//////////////////////////////////////////////////////////////////////////////////////////////

// delay, to let processor to compile and execute rest of the code (safe khelne ke liye 😎)

setTimeout(function () {
    var uid = uniqueId(20),
        iCDate = uid.substr(0, uid.indexOf('-')).toDec(36),
        newNode = new TreeMap(uid, "Root", 1, iCDate);

    TreeMap.rootNode = newNode;
    TreeMap.activeNode = newNode;
}, 10); 