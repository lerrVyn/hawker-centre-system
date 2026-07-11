// Wei Ye
function getGrade(score) {
    if (score >= 80) { grade = "A"; }
    else if (score >= 70) { grade = "B"; }
    else if (score >= 60) { grade = "C"; }
    else { grade = "D" }
    return grade;
}

module.exports = { 
    getGrade 
};