from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    Flowable,
    KeepTogether,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "test-assets" / "Cours_test_SVT_digestion_2h.pdf"
OUTPUT.parent.mkdir(parents=True, exist_ok=True)

FONT_REGULAR = Path(r"C:\Windows\Fonts\arial.ttf")
FONT_BOLD = Path(r"C:\Windows\Fonts\arialbd.ttf")
pdfmetrics.registerFont(TTFont("CourseSans", str(FONT_REGULAR)))
pdfmetrics.registerFont(TTFont("CourseSans-Bold", str(FONT_BOLD)))

GREEN = colors.HexColor("#0F766E")
DARK = colors.HexColor("#17352B")
MINT = colors.HexColor("#E8F4EF")
PALE = colors.HexColor("#F5F8F6")
AMBER = colors.HexColor("#D99127")
TEXT = colors.HexColor("#1F2933")
MUTED = colors.HexColor("#617069")
LINE = colors.HexColor("#D7E1DC")


class DigestiveDiagram(Flowable):
    def __init__(self, width=16.5 * cm, height=8.2 * cm):
        super().__init__()
        self.width = width
        self.height = height

    def draw(self):
        c = self.canv
        w, h = self.width, self.height
        c.setFillColor(colors.HexColor("#F7FAF8"))
        c.setStrokeColor(LINE)
        c.roundRect(0, 0, w, h, 10, fill=1, stroke=1)
        c.setFont("CourseSans-Bold", 11)
        c.setFillColor(DARK)
        c.drawString(14, h - 20, "Schéma fonctionnel : trajet et transformation des aliments")

        points = [
            (1.4 * cm, 3.6 * cm, "Bouche", "mastication + salive"),
            (5.1 * cm, 3.6 * cm, "Estomac", "brassage + suc gastrique"),
            (9.0 * cm, 3.6 * cm, "Intestin grêle", "digestion finale"),
            (13.2 * cm, 3.6 * cm, "Sang", "nutriments absorbés"),
        ]
        for index, (x, y, title, subtitle) in enumerate(points):
            c.setFillColor(MINT if index < 3 else colors.HexColor("#FFF1D9"))
            c.setStrokeColor(GREEN if index < 3 else AMBER)
            c.roundRect(x, y, 2.65 * cm, 1.35 * cm, 8, fill=1, stroke=1)
            c.setFillColor(DARK)
            c.setFont("CourseSans-Bold", 9)
            c.drawCentredString(x + 1.325 * cm, y + 0.83 * cm, title)
            c.setFillColor(MUTED)
            c.setFont("CourseSans", 7.5)
            c.drawCentredString(x + 1.325 * cm, y + 0.43 * cm, subtitle)
            if index < len(points) - 1:
                start = x + 2.65 * cm
                end = points[index + 1][0]
                mid_y = y + 0.68 * cm
                c.setStrokeColor(GREEN)
                c.setLineWidth(1.5)
                c.line(start + 3, mid_y, end - 5, mid_y)
                c.line(end - 10, mid_y + 4, end - 5, mid_y)
                c.line(end - 10, mid_y - 4, end - 5, mid_y)

        c.setFillColor(colors.HexColor("#FFFFFF"))
        c.setStrokeColor(LINE)
        c.roundRect(1.4 * cm, 0.7 * cm, 14.45 * cm, 1.5 * cm, 7, fill=1, stroke=1)
        c.setFillColor(TEXT)
        c.setFont("CourseSans-Bold", 9)
        c.drawString(1.7 * cm, 1.62 * cm, "Idée essentielle")
        c.setFont("CourseSans", 8.5)
        c.drawString(1.7 * cm, 1.15 * cm, "Les aliments sont simplifiés en nutriments, puis les nutriments traversent la paroi intestinale.")


def paragraph(text, style):
    return Paragraph(text, style)


styles = getSampleStyleSheet()
styles.add(ParagraphStyle(
    name="CoverKicker", fontName="CourseSans-Bold", fontSize=10, leading=13,
    textColor=GREEN, alignment=TA_CENTER, spaceAfter=10, uppercase=True,
))
styles.add(ParagraphStyle(
    name="CoverTitle", fontName="CourseSans-Bold", fontSize=28, leading=33,
    textColor=DARK, alignment=TA_CENTER, spaceAfter=13,
))
styles.add(ParagraphStyle(
    name="CoverSub", fontName="CourseSans", fontSize=12, leading=18,
    textColor=MUTED, alignment=TA_CENTER, spaceAfter=20,
))
styles.add(ParagraphStyle(
    name="H1Course", fontName="CourseSans-Bold", fontSize=20, leading=25,
    textColor=DARK, spaceAfter=12, spaceBefore=3,
))
styles.add(ParagraphStyle(
    name="H2Course", fontName="CourseSans-Bold", fontSize=13, leading=17,
    textColor=GREEN, spaceAfter=7, spaceBefore=10,
))
styles.add(ParagraphStyle(
    name="BodyCourse", fontName="CourseSans", fontSize=9.4, leading=14,
    textColor=TEXT, spaceAfter=6,
))
styles.add(ParagraphStyle(
    name="SmallCourse", fontName="CourseSans", fontSize=8, leading=11,
    textColor=MUTED, spaceAfter=4,
))
styles.add(ParagraphStyle(
    name="CalloutCourse", fontName="CourseSans", fontSize=9.2, leading=14,
    textColor=DARK, leftIndent=9, rightIndent=9, borderColor=GREEN,
    borderWidth=0.8, borderPadding=9, backColor=MINT, spaceAfter=10,
))
styles.add(ParagraphStyle(
    name="BlockTitle", fontName="CourseSans-Bold", fontSize=9, leading=12,
    textColor=DARK,
))
styles.add(ParagraphStyle(
    name="TableSmall", fontName="CourseSans", fontSize=7.6, leading=10,
    textColor=TEXT,
))


def page_header_footer(canvas, doc):
    canvas.saveState()
    width, height = A4
    if doc.page > 1:
        canvas.setStrokeColor(LINE)
        canvas.line(1.8 * cm, height - 1.35 * cm, width - 1.8 * cm, height - 1.35 * cm)
        canvas.setFont("CourseSans-Bold", 8)
        canvas.setFillColor(GREEN)
        canvas.drawString(1.8 * cm, height - 1.05 * cm, "CLASSES CONNECTÉES · PDF DE TEST PROFESSEUR")
    canvas.setFont("CourseSans", 7.5)
    canvas.setFillColor(MUTED)
    canvas.drawString(1.8 * cm, 1.1 * cm, "Cours test — La digestion et l’absorption intestinale")
    canvas.drawRightString(width - 1.8 * cm, 1.1 * cm, f"Page {doc.page}")
    canvas.restoreState()


def info_table(rows, widths=(4.4 * cm, 11.6 * cm)):
    data = [[paragraph(f"<b>{left}</b>", styles["TableSmall"]), paragraph(right, styles["TableSmall"])] for left, right in rows]
    table = Table(data, colWidths=list(widths), hAlign="LEFT")
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, -1), MINT),
        ("BACKGROUND", (1, 0), (1, -1), colors.white),
        ("BOX", (0, 0), (-1, -1), 0.6, LINE),
        ("INNERGRID", (0, 0), (-1, -1), 0.4, LINE),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
    ]))
    return table


def blocks_table(rows):
    header = ["Durée", "Type de bloc", "Titre", "Objectif / consigne", "Ressource"]
    data = [[paragraph(f"<b>{h}</b>", styles["TableSmall"]) for h in header]]
    for row in rows:
        data.append([paragraph(str(cell), styles["TableSmall"]) for cell in row])
    table = Table(data, colWidths=[1.25 * cm, 2.15 * cm, 3.25 * cm, 6.0 * cm, 3.3 * cm], repeatRows=1)
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), DARK),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, PALE]),
        ("BOX", (0, 0), (-1, -1), 0.6, LINE),
        ("INNERGRID", (0, 0), (-1, -1), 0.35, LINE),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    return table


story = []
story.extend([
    Spacer(1, 2.4 * cm),
    paragraph("PDF SIMPLE PRÉPARÉ PAR LE PROFESSEUR", styles["CoverKicker"]),
    paragraph("La digestion et<br/>l’absorption intestinale", styles["CoverTitle"]),
    paragraph("Cours test de SVT · 3e année collège · Durée totale : 2 heures", styles["CoverSub"]),
    Spacer(1, 0.5 * cm),
    info_table([
        ("Matière", "Sciences de la vie et de la Terre (SVT)"),
        ("Niveau", "3e année collège / 3APIC"),
        ("Durée", "120 minutes, organisées en 2 séances de 60 minutes"),
        ("Temps d’explication", "Séance 1 : 18 min · Séance 2 : 17 min · Total : 35 min"),
        ("Objectif général", "Expliquer la transformation des aliments en nutriments et le passage des nutriments vers le sang."),
        ("Prérequis", "Organes du tube digestif, besoins nutritionnels et rôle du sang."),
    ]),
    Spacer(1, 0.6 * cm),
    paragraph("Ce document est conçu pour tester l’import PDF, l’association automatique des médias et la génération de blocs standardisés. Le professeur doit pouvoir corriger, valider puis publier le résultat.", styles["CalloutCourse"]),
    PageBreak(),
])

story.extend([
    paragraph("1. Ressources pédagogiques à importer séparément", styles["H1Course"]),
    paragraph("Les noms de fichiers doivent être respectés exactement. Chaque ressource possède un objectif précis.", styles["BodyCourse"]),
    info_table([
        ("schema_tube_digestif.png", "Schéma — comprendre l’organisation et l’ordre des organes du tube digestif."),
        ("video_progression_aliments.mp4", "Vidéo — comprendre le mouvement des aliments et le brassage dans le tube digestif."),
        ("image_villosite_intestinale.jpg", "Image — observer et identifier les caractéristiques d’une villosité intestinale."),
        ("simulation_absorption_intestinale.html", "Simulation — manipuler la taille des molécules et expérimenter leur passage à travers la paroi intestinale."),
        ("quiz_digestion.json", "Quiz — vérifier la compréhension des transformations et de l’absorption."),
    ], widths=(6.2 * cm, 9.8 * cm)),
    Spacer(1, 0.45 * cm),
    DigestiveDiagram(),
    Spacer(1, 0.35 * cm),
    paragraph("Association attendue : ne jamais inventer un fichier absent. Si une ressource citée n’est pas importée, afficher un avertissement au professeur.", styles["CalloutCourse"]),
    PageBreak(),
])

session1 = [
    ("5 min", "question", "Situation de départ", "Pourquoi un morceau de pain ne garde-t-il pas la même forme tout au long du tube digestif ? Recueillir deux hypothèses.", "—"),
    ("6 min", "schema", "Repérer les organes", "Identifier la bouche, l’œsophage, l’estomac, l’intestin grêle et le gros intestin.", "schema_tube_digestif.png"),
    ("10 min", "text", "Transformations mécaniques", "Explication : mastication, brassage et progression. Distinguer transformation mécanique et chimique.", "—"),
    ("8 min", "video", "Observer le mouvement", "Avant la vidéo, demander d’observer la direction du déplacement et le brassage.", "video_progression_aliments.mp4"),
    ("8 min", "text", "Transformations chimiques", "Explication : les sucs digestifs simplifient progressivement les grosses molécules alimentaires.", "—"),
    ("10 min", "activity", "Comparer avant / après", "Compléter un tableau : aliment dans la bouche, contenu de l’estomac, nutriments dans l’intestin grêle.", "—"),
    ("8 min", "question", "Vérification rapide", "Citer une transformation mécanique et une transformation chimique, puis expliquer leur différence.", "—"),
    ("5 min", "summary", "Synthèse de la séance", "Les aliments subissent des transformations mécaniques et chimiques qui produisent des nutriments.", "—"),
]
story.extend([
    paragraph("2. Séance 1 — La transformation des aliments", styles["H1Course"]),
    paragraph("Durée : <b>60 minutes</b> · Explication professeur : <b>18 minutes</b>", styles["CalloutCourse"]),
    paragraph("Objectif : distinguer les transformations mécaniques et chimiques et expliquer la formation des nutriments.", styles["BodyCourse"]),
    blocks_table(session1),
    Spacer(1, 0.35 * cm),
    paragraph("Contenu scientifique à respecter", styles["H2Course"]),
    paragraph("La mastication fragmente les aliments. Dans l’estomac, le brassage mélange les aliments aux sucs digestifs. Les enzymes contenues dans les sucs digestifs accélèrent la transformation de grosses molécules en molécules plus petites appelées nutriments. Une transformation mécanique modifie la forme ou la taille ; une transformation chimique produit de nouvelles molécules.", styles["BodyCourse"]),
    paragraph("Point de vigilance : ne pas dire que tous les aliments sont totalement digérés dans l’estomac. La digestion se poursuit surtout dans l’intestin grêle.", styles["CalloutCourse"]),
    PageBreak(),
])

story.extend([
    paragraph("Document scientifique — Exemples de transformations", styles["H1Course"]),
    paragraph("Le tableau suivant peut servir de support au bloc d’activité de la séance 1.", styles["BodyCourse"]),
    Table([
        [paragraph("<b>Lieu</b>", styles["TableSmall"]), paragraph("<b>Transformation dominante</b>", styles["TableSmall"]), paragraph("<b>Résultat observable</b>", styles["TableSmall"])],
        [paragraph("Bouche", styles["TableSmall"]), paragraph("Mastication + action de la salive", styles["TableSmall"]), paragraph("Aliments fragmentés et humidifiés", styles["TableSmall"])],
        [paragraph("Estomac", styles["TableSmall"]), paragraph("Brassage + suc gastrique", styles["TableSmall"]), paragraph("Contenu semi-liquide", styles["TableSmall"])],
        [paragraph("Intestin grêle", styles["TableSmall"]), paragraph("Action de plusieurs sucs digestifs", styles["TableSmall"]), paragraph("Formation de nutriments absorbables", styles["TableSmall"])],
    ], colWidths=[3.2 * cm, 6.1 * cm, 6.7 * cm], style=TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), DARK), ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, PALE]), ("BOX", (0, 0), (-1, -1), 0.6, LINE),
        ("INNERGRID", (0, 0), (-1, -1), 0.35, LINE), ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 7), ("RIGHTPADDING", (0, 0), (-1, -1), 7),
        ("TOPPADDING", (0, 0), (-1, -1), 8), ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ])),
    Spacer(1, 0.55 * cm),
    paragraph("Question guidée", styles["H2Course"]),
    paragraph("À partir du tableau, explique en quatre phrases comment un aliment solide devient un ensemble de nutriments capables de traverser la paroi intestinale.", styles["CalloutCourse"]),
    paragraph("Réponse attendue : les aliments sont d’abord fragmentés. Ils sont ensuite mélangés aux sucs digestifs. Les enzymes les simplifient en nutriments. Les nutriments obtenus peuvent être absorbés au niveau de l’intestin grêle.", styles["SmallCourse"]),
    PageBreak(),
])

session2 = [
    ("5 min", "question", "Problème scientifique", "Comment les nutriments présents dans l’intestin grêle rejoignent-ils les organes ?", "—"),
    ("7 min", "image", "Observer une villosité", "Identifier une paroi fine, de nombreux capillaires sanguins et une grande surface d’échange.", "image_villosite_intestinale.jpg"),
    ("9 min", "text", "Définir l’absorption", "Explication : passage des nutriments de l’intestin grêle vers le sang à travers la paroi intestinale.", "—"),
    ("12 min", "simulation", "Tester le passage", "Modifier la taille des molécules. Noter lesquelles traversent la paroi et justifier le résultat.", "simulation_absorption_intestinale.html"),
    ("8 min", "text", "Rôle des villosités", "Explication : surface étendue, paroi fine et réseau sanguin favorisent les échanges.", "—"),
    ("7 min", "activity", "Interpréter les résultats", "Construire une conclusion reliant petite taille des nutriments et passage vers le sang.", "—"),
    ("7 min", "evaluation", "Quiz de compréhension", "Utiliser cinq questions : QCM, vrai/faux et réponse courte.", "quiz_digestion.json"),
    ("5 min", "summary", "Bilan général", "Digestion = production de nutriments ; absorption = passage des nutriments vers le sang.", "—"),
]
story.extend([
    paragraph("3. Séance 2 — L’absorption intestinale", styles["H1Course"]),
    paragraph("Durée : <b>60 minutes</b> · Explication professeur : <b>17 minutes</b>", styles["CalloutCourse"]),
    paragraph("Objectif : expliquer le passage des nutriments dans le sang et relier la structure des villosités à leur fonction.", styles["BodyCourse"]),
    blocks_table(session2),
    Spacer(1, 0.35 * cm),
    paragraph("Contenu scientifique à respecter", styles["H2Course"]),
    paragraph("L’absorption intestinale est le passage des nutriments présents dans l’intestin grêle vers le sang. La paroi interne de l’intestin grêle présente de nombreux replis appelés villosités. Leur grande surface, leur paroi fine et leurs nombreux capillaires sanguins facilitent le passage rapide des nutriments vers le sang.", styles["BodyCourse"]),
    paragraph("Point de vigilance : les aliments entiers ne passent pas dans le sang. Ce sont principalement les nutriments issus de la digestion qui traversent la paroi intestinale.", styles["CalloutCourse"]),
    PageBreak(),
])

story.extend([
    paragraph("4. Évaluation finale et critères de réussite", styles["H1Course"]),
    paragraph("L’évaluation doit vérifier la compréhension, pas uniquement la mémorisation du vocabulaire.", styles["BodyCourse"]),
    info_table([
        ("Question 1 — QCM", "Quel organe est le principal lieu de l’absorption des nutriments ? Réponse correcte : l’intestin grêle."),
        ("Question 2 — Vrai/Faux", "La mastication est une transformation chimique. Réponse : Faux, c’est une transformation mécanique."),
        ("Question 3 — Réponse courte", "Définir l’absorption intestinale en utilisant les mots nutriments, paroi intestinale et sang."),
        ("Question 4 — Observation", "Citer deux caractéristiques d’une villosité favorisant l’absorption."),
        ("Question 5 — Raisonnement", "Expliquer pourquoi une grosse molécule non digérée traverse difficilement la paroi intestinale."),
    ]),
    Spacer(1, 0.5 * cm),
    paragraph("Critères de réussite", styles["H2Course"]),
    paragraph("L’élève distingue transformation mécanique et chimique ; utilise correctement le terme nutriment ; localise l’absorption dans l’intestin grêle ; relie la structure des villosités à leur fonction ; explique le passage vers le sang avec une phrase scientifiquement correcte.", styles["CalloutCourse"]),
    paragraph("Consignes de supervision pour le professeur", styles["H2Course"]),
    paragraph("1. Vérifier que les deux séances durent chacune 60 minutes.<br/>2. Vérifier que le temps total d’explication est de 35 minutes pour 2 heures.<br/>3. Contrôler les associations exactes entre blocs et noms de fichiers.<br/>4. Corriger uniquement les erreurs scientifiques ou les consignes ambiguës.<br/>5. Valider tous les blocs avant de publier.", styles["BodyCourse"]),
    Spacer(1, 0.4 * cm),
    paragraph("Résultat attendu du test : 2 séances, 16 blocs standardisés, 5 ressources associées et un avertissement pour chaque fichier cité mais non importé.", styles["CalloutCourse"]),
])


doc = SimpleDocTemplate(
    str(OUTPUT), pagesize=A4, rightMargin=1.8 * cm, leftMargin=1.8 * cm,
    topMargin=1.65 * cm, bottomMargin=1.6 * cm,
    title="Cours test SVT — La digestion et l'absorption intestinale",
    author="Classes Connectées",
    subject="PDF de test pour l'import et la structuration automatique par IA",
)
doc.build(story, onFirstPage=page_header_footer, onLaterPages=page_header_footer)
print(OUTPUT)
