var M = {
    v: 'v',
    f: function() {
        console.log(this.v);
    }
}

// 해당 객체를 module 화 하기
module.exports = M;