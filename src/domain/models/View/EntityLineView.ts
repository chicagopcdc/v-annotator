import { SVGNS } from "../Character/SVGNS";
import { Entities, Entity } from "../Label/Entity";
import { Labels } from "../Label/Label";
import { TextLine } from "../Line/TextLine";
import { EventEmitter } from "events";

const lineWidth = 3;
const radius = 3;

export class EntityLineView {
  constructor(
    private svgElement: SVGSVGElement,
    private entities: Entities,
    private labels: Labels,
    private textLine: TextLine,
    private emitter: EventEmitter
  ) {}

  render(): SVGGElement {
    const elements = document.createElementNS(SVGNS, "g") as SVGGElement;
    for (const entity of this.entities.list()) {
      const [x1, x2] = this.textLine.range(
        entity.startOffset,
        entity.endOffset
      );
      const entityLabelElement = document.createElementNS(
        SVGNS,
        "g"
      ) as SVGGElement;
      const lineElement = this.createLineElement(entity, x1, x2);
      entityLabelElement.appendChild(lineElement);
      // Do not show a label text if the entity continues from the previous line.
      if (this.textLine.startOffset <= entity.startOffset) {
        const circleElement = this.createCircleElement(entity, x1);
        const textElement = this.createLabelTextElement(entity, x1);
        entityLabelElement.appendChild(circleElement);
        entityLabelElement.appendChild(textElement);
      }
      elements.appendChild(entityLabelElement);
    }
    this.svgElement.appendChild(elements);
    return elements;
  }

  private color(entity: Entity): string {
    const label = this.labels.getById(entity.label);
    return label!.color;
  }

  private labelText(entity: Entity): string {
    const label = this.labels.getById(entity.label);
    return label!.text;
  }

  private calculateLineY(entity: Entity): number {
    const level = this.entities.getLevelOf(entity.id)!;
    const marginTop = 3;
    return (lineWidth + marginTop) * (level + 1);
  }

  private calculateTextY(entity: Entity): number {
    const level = this.entities.getLevelOf(entity.id)!;
    const overlap = this.entities.getOverlapOf(entity.id)!;
    const lineHeight = lineWidth * (2 * overlap - 1);
    return 20 * (level + 1) + lineHeight;
  }

  private createLineElement(entity: Entity, x1: number, x2: number) {
    const lineElement = document.createElementNS(
      SVGNS,
      "line"
    ) as SVGLineElement;
    const y = this.calculateLineY(entity);
    // The width is extended by a half circle with a diameter equal to the stroke width.
    // So we need to adjust the x1 and x2.
    // https://developer.mozilla.org/en-US/docs/Web/SVG/Attribute/stroke-linecap#round
    lineElement.setAttribute("x1", (x1 + lineWidth / 2).toString());
    lineElement.setAttribute("x2", (x2 - lineWidth / 2).toString());
    lineElement.setAttribute("y1", y.toString());
    lineElement.setAttribute("y2", y.toString());
    lineElement.setAttribute("stroke-width", lineWidth.toString());
    lineElement.setAttribute("stroke-linecap", "round");
    lineElement.setAttribute("stroke", this.color(entity));
    return lineElement;
  }

  private createCircleElement(entity: Entity, x1: number) {
    const circleElement = document.createElementNS(
      SVGNS,
      "circle"
    ) as SVGCircleElement;
    const y = this.calculateTextY(entity);
    circleElement.setAttribute("fill", this.color(entity));
    circleElement.setAttribute("cx", (x1 + radius).toString());
    circleElement.setAttribute("r", radius.toString());
    circleElement.setAttribute("cy", y.toString());
    return circleElement;
  }

  private createLabelTextElement(entity: Entity, x1: number) {
    const textElement = document.createElementNS(
      SVGNS,
      "text"
    ) as SVGTextElement;
    const y = this.calculateTextY(entity);
    const marginLeft = 5;
    textElement.setAttribute("fill", "grey");
    textElement.setAttribute("x", (x1 + radius + marginLeft).toString());
    textElement.setAttribute("y", y.toString());
    textElement.setAttribute("dy", "0.35em");
    textElement.style.cursor = "pointer";
    textElement.style.userSelect = "none";
    textElement.textContent = this.labelText(entity);
    textElement.onclick = () => {
      this.emitter.emit("click:label", entity.id);
    };
    return textElement;
  }
}
