let userDetails = {
    id: "",
    usuario: "",
    nome: "",
    pontos: "",
    jogos: ""
};
let userStatus = 0;

var currentDecimalNumber = 0;
var i = 0;

export async function checkLogin() {
    const response = await fetch(
        'https://festa-binaria.onrender.com/check-login',
        { credentials: 'include' }
    );
    const data = await response.json();
    if (data.logged) {
        userDetails = {
            id: data.usuario.ID,
            usuario: data.usuario.Usuario,
            nome: data.usuario.Nome,
            pontos: data.usuario.Pontos,
            jogos: data.usuario.Jogos
        };
        userStatus = 1;
    } else {
        userStatus = 0;
    }
}

function sortNumber(userPoints) {
    let minBits = 1;
    let maxBits = 4;

    let limit = 12;
    let increment = 15;

    // <= 12 --> 4
    // <= 12 + 15 = 27 --> 5
    // <= 12 + 15 + 18 = 45 -- > 6
    // <= 12 + 15 + 18 + 21 = 66 --> 7

    // Ajusta faixas
    while (userPoints > limit) {
        minBits = maxBits;
        maxBits++;
        limit += increment;
        increment += 3;
    }

    let minDecimal;
    let maxDecimal;

    // Primeira faixa: até 4 bits
    if (maxBits === 4) {
        minDecimal = 1;
        maxDecimal = 15;
    } else {
        // menor número com minBits bits
        minDecimal = Math.pow(2, minBits - 1);

        // maior número com maxBits bits
        maxDecimal = Math.pow(2, maxBits) - 1;
    }

    return Math.floor(
        Math.random() * (maxDecimal - minDecimal + 1)
    ) + minDecimal;
}

export default function showPuzzle(puzzletemplate, gridtemplate) {
    currentDecimalNumber = sortNumber(Number(userDetails.pontos));
    const decimalNum = currentDecimalNumber;
    const binaryNum = decimalNum.toString(2);
    const numColumns = binaryNum.length;

    puzzletemplate.innerHTML = "";
    puzzletemplate.style.gridTemplateColumns = "";

    gridtemplate.innerHTML = "";
    gridtemplate.style.gridTemplateColumns = "";

    for (i = 0; i < numColumns; i++) {
        puzzletemplate.innerHTML += `
            <span class='digit' onclick='switchValue(this)'>0</span>
        `;

        gridtemplate.innerHTML += `
            <span>
                2
                <span style='vertical-align: super; font-size: 0.75em;'>
                    ${numColumns - i - 1}
                </span>
            </span>
        `;
    }

    puzzletemplate.innerHTML += `<span>=</span>`;
    puzzletemplate.innerHTML += `<span>${decimalNum}</span>`;

    puzzletemplate.style.display = "grid";
    puzzletemplate.style.gridTemplateColumns =
        `repeat(${numColumns + 2}, 1fr)`;

    gridtemplate.innerHTML += `<span></span>`;
    gridtemplate.innerHTML += `<span></span>`;

    gridtemplate.style.display = "grid";
    gridtemplate.style.gridTemplateColumns =
        `repeat(${numColumns + 2}, 1fr)`;

    return decimalNum;
}

export async function checkAnswer() {
    const digits = document.querySelectorAll(".digit");
    const correctBinary = currentDecimalNumber.toString(2);

    let userBinary = "";
    let gainedPoints = 0;

    digits.forEach((digit, index) => {
        userBinary += digit.innerHTML;
        if (digit.innerHTML == correctBinary[index]) gainedPoints++;
    });

    // Atualiza pontos no banco
    if (userStatus == 1) {
        try {
            const response = await fetch(
                'https://festa-binaria.onrender.com/update-points',
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type':
                            'application/json'
                    },
                    credentials: 'include',
                    body: JSON.stringify({
                        pontosGanhos: gainedPoints
                    })
                }
            );

            const data = await response.json();

            if (data.success) {
                userDetails = {
                    id: data.usuario.ID,
                    usuario: data.usuario.Usuario,
                    nome: data.usuario.Nome,
                    pontos: data.usuario.Pontos,
                    jogos: data.usuario.Jogos
                };
                console.log(
                    'Pontos atualizados:',
                    userDetails.pontos
                );
            }
        } catch (err) {
            console.error(
                'Erro ao atualizar pontos:',
                err
            );
        }
    }

    if (userBinary === correctBinary) {
        alert(`Resposta correta! Pontos ganhados: ${gainedPoints}`);
        return true;
    } else {
        alert(`Resposta incorreta! O correto era: ${correctBinary}. Pontos ganhados: ${gainedPoints}`);
        return false;
    }
}

export async function showRanking() {
    const rankDisplay = document.getElementById("rank-display");

    try {
        const response = await fetch('https://festa-binaria.onrender.com/ranking');

        const data = await response.json();
        console.log(data);

        if (data.success) {
            rankDisplay.innerHTML = `
                <div class="player">
                    <p>Nome</p>
                    <p>Pontos</p>
                </div>
            `;
            data.ranking.forEach(item => {
                rankDisplay.innerHTML += `
                    <div class="player">
                        <p>${item.Nome}</p>
                        <p>${item.Pontos}</p>
                    </div>
                `;
            });
        } else {
            console.error('Erro ao apresentar ranking');
        }
    } catch (err) {
        console.error(
            'Erro ao buscar ranking:',
            err
        );
    }
}

export { userDetails };