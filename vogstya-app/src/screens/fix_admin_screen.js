const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'AdminPanelScreen.js');
let content = fs.readFileSync(filePath, 'utf8');

const target = `                                    ) : col.type === "status" ? (
                                      <View style={[styles.toggleTrack, styles.colorToggleTrack, row[col.name] === 1 && styles.toggleTrackActive]}>
                                        <View style={[styles.toggleThumb, row[col.name] === 1 && styles.toggleThumbActive]} />
                                      </View>
                                        )}
                                      </View>
                                    ) : col.type === "status" ? (
                                      <View style={[styles.toggleTrack, row[col.name] === 1 && styles.toggleTrackActive]}>
                                        <View style={[styles.toggleThumb, row[col.name] === 1 && styles.toggleThumbActive]} />
                                      </View>
                                    ) : (
                                      <Text style={styles.cellText} numberOfLines={1}>{row[col.name] || "—"}</Text>
                                    )}
                                  </View>
                                ));
                              }`;

const replacement = `                                    ) : col.type === "status" ? (
                                      <View style={[styles.toggleTrack, styles.colorToggleTrack, row[col.name] === 1 && styles.toggleTrackActive]}>
                                        <View style={[styles.toggleThumb, row[col.name] === 1 && styles.toggleThumbActive]} />
                                      </View>
                                    ) : (
                                      <Text style={styles.cellText} numberOfLines={1}>{row[col.name] || "—"}</Text>
                                    )}
                                  </View>
                                ));
                              }
                              if (selectedTable === "sizes") {
                                return [
                                  { name: "name", width: 420, type: "text" },
                                  { name: "status", width: 180, type: "status" },
                                ].map(col => (
                                  <View key={col.name} style={[styles.cell, { width: col.width }]}>
                                    {col.type === "status" ? (
                                      <View style={[styles.toggleTrack, styles.colorToggleTrack, row[col.name] === 1 && styles.toggleTrackActive]}>
                                        <View style={[styles.toggleThumb, row[col.name] === 1 && styles.toggleThumbActive]} />
                                      </View>
                                    ) : (
                                      <Text style={styles.cellText} numberOfLines={1}>{row[col.name] || "—"}</Text>
                                    )}
                                  </View>
                                ));
                              }
                              if (selectedTable === "specificationvalues" || selectedTable === "specification_values") {
                                return [
                                  { name: "specification_id", width: 180, type: "text" },
                                  { name: "name", width: 180, type: "text" },
                                  { name: "status", width: 120, type: "status" },
                                ].map(col => (
                                  <View key={col.name} style={[styles.cell, { width: col.width }]}>
                                    {col.type === "status" ? (
                                      <View style={[styles.toggleTrack, row[col.name] === 1 && styles.toggleTrackActive]}>
                                        <View style={[styles.toggleThumb, row[col.name] === 1 && styles.toggleThumbActive]} />
                                      </View>
                                    ) : (
                                      <Text style={styles.cellText} numberOfLines={1}>{col.name === "specification_id" ? (row.specification_name || row[col.name] || "—") : (row[col.name] || "—")}</Text>
                                    )}
                                  </View>
                                ));
                              }
                              if (selectedTable === "specifications") {
                                return [
                                  { name: "category_id", width: 140, type: "text" },
                                  { name: "name", width: 180, type: "text" },
                                  { name: "status", width: 120, type: "status" },
                                ].map(col => (
                                  <View key={col.name} style={[styles.cell, { width: col.width }]}>
                                    {col.type === "status" ? (
                                      <View style={[styles.toggleTrack, row[col.name] === 1 && styles.toggleTrackActive]}>
                                        <View style={[styles.toggleThumb, row[col.name] === 1 && styles.toggleThumbActive]} />
                                      </View>
                                    ) : (
                                      <Text style={styles.cellText} numberOfLines={1}>{col.name === "category_id" ? (row.category_name || row[col.name] || "—") : (row[col.name] || "—")}</Text>
                                    )}
                                  </View>
                                ));
                              }
                              if (selectedTable === "brands") {
                                return [
                                  { name: "name", width: 180, type: "text" },
                                  { name: "status", width: 120, type: "status" },
                                ].map(col => (
                                  <View key={col.name} style={[styles.cell, { width: col.width }]}>
                                    {col.type === "status" ? (
                                      <View style={[styles.toggleTrack, row[col.name] === 1 && styles.toggleTrackActive]}>
                                        <View style={[styles.toggleThumb, row[col.name] === 1 && styles.toggleThumbActive]} />
                                      </View>
                                    ) : (
                                      <Text style={styles.cellText} numberOfLines={1}>{row[col.name] || "—"}</Text>
                                    )}
                                  </View>
                                ));
                              }
                              if (selectedTable === "categories") {
                                return [
                                  { name: "image_url", width: 100, type: "image" },
                                  { name: "name", width: 180, type: "text" },
                                  { name: "status", width: 120, type: "status" },
                                ].map(col => (
                                  <View key={col.name} style={[styles.cell, { width: col.width }]}>
                                    {col.type === "image" ? (
                                      <View style={styles.thumbnailContainer}>
                                        {row[col.name] ? (
                                          <Image source={{ uri: row[col.name] }} style={styles.thumbnailImg} />
                                        ) : (
                                          <Ionicons name="image-outline" size={20} color="#cbd5e1" />
                                        )}
                                      </View>
                                    ) : col.type === "status" ? (
                                      <View style={[styles.toggleTrack, row[col.name] === 1 && styles.toggleTrackActive]}>
                                        <View style={[styles.toggleThumb, row[col.name] === 1 && styles.toggleThumbActive]} />
                                      </View>
                                    ) : (
                                      <Text style={styles.cellText} numberOfLines={1}>{row[col.name] || "—"}</Text>
                                    )}
                                  </View>
                                ));
                              }`;

if (content.includes(target)) {
    content = content.replace(target, replacement);
    fs.writeFileSync(filePath, content);
    console.log('Successfully fixed AdminPanelScreen.js');
} else {
    console.error('Target content not found!');
}
