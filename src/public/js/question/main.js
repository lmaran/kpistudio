import { fetchHelpers } from "../helpers/fetch.helper.js";

// event binders
const questionTxt = document.getElementById("question-txt");
const submitBtn = document.getElementById("submit-btn");
const resultDivOriginal = document.getElementById("result-div-original");
const resultDivOriginalFormatted = document.getElementById("result-div-original-formatted");
const resultDivKatex = document.getElementById("result-div-katex");

// init
// const initStr = `
// # Triangle Let the right triangle hypothenuse be aligned with the coordinate system *x-axis*. The vector loop closure equation then reads $$a{\bold e}_\alpha + b\tilde{\bold e}_\alpha + c{\bold e}_x = \bold 0$$ (1) with $${\bold e}_\alpha = \begin{pmatrix}\cos\alpha\\ \sin\alpha\end{pmatrix} \quad and \quad {\tilde\bold e}_\alpha = \begin{pmatrix}-\sin\alpha\\ \cos\alpha\end{pmatrix}$$ Resolving for the hypothenuse part $c{\bold e}_x$ in the loop closure equation (1) $$-c{\bold e}_x = a{\bold e}_\alpha + b\tilde{\bold e}_\alpha$$ and squaring > finally results in the Pythagorean theorem (2) > > $$ c^2 = a^2 + b^2 $$ (2)
// `;

// const initStr =
//     "# Triangle \n\nLet the right triangle hypothenuse be aligned with the coordinate system *x-axis*. \nThe vector loop closure equation then reads\n\n$$a{\\bold e}_\\alpha + b\\tilde{\\bold e}_\\alpha + c{\\bold e}_x = \\bold 0$$ (1)\n\nwith\n\n$${\\bold e}_\\alpha = \\begin{pmatrix}\\cos\\alpha\\\\ \\sin\\alpha\\end{pmatrix} \\quad and \\quad {\\tilde\\bold e}_\\alpha = \\begin{pmatrix}-\\sin\\alpha\\\\ \\cos\\alpha\\end{pmatrix}$$\n\nResolving for the hypothenuse part $c{\\bold e}_x$ in the loop closure equation (1) \n\n$$-c{\\bold e}_x = a{\\bold e}_\\alpha + b\\tilde{\\bold e}_\\alpha$$\n\nand squaring \n\n> finally results in the Pythagorean theorem (2)\n>\n> $$ c^2 = a^2 + b^2 $$ (2)";

// demo here https://goessner.github.io/markdown-it-texmath/markdown-it-texmath-demo.html
const initStr =
    "Fie mulțimile $A = \\{ x \\in \\mathbb{N} \\mid x+3<8 \\}$ si $B = \\{ x \\in \\mathbb{N}, \\space x$ divizor al lui 10 $\\}.$\\\na) Scrieți elementele mulțimilor $A$ si $B$.\\\nb) Scrieți elementele mulțimilor $A$ si $B$.\n\nResolving for the hypothenuse part $c{\\bold e}_x$ in the loop closure equation (1) \n\n$$-c{\\bold e}_x = a{\\bold e}_\\alpha + b\\tilde{\\bold e}_\\alpha$$ (2)";

questionTxt.value = initStr;

// event handlers
const eventHandlers = {
    saveQuestion: async () => {
        const data = { str: questionTxt.value };
        const createdQuestion = await createQuestion(data);
        resultDivOriginal.innerHTML = createdQuestion.str;
        resultDivOriginalFormatted.value = createdQuestion.str;
        resultDivKatex.innerHTML = createdQuestion.strKatex;
    }
};

submitBtn.addEventListener("click", eventHandlers.saveQuestion);

// question services
const createQuestion = async data => {
    return fetchHelpers.post("/probleme", data);
};
